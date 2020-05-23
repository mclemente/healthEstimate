import {isEmpty, t} from "./utils.js"

export let fractionFormula
export let breakOverlayRender
export let systemSpecificSettings = {
	"core.deathState":  {
		"type":    Boolean,
		"default": false
	},
	"core.deathMarker": {
		type:    String,
		default: "icons/svg/skull.svg",
	}
}

const tempHPSetting = {
	type:    Boolean,
	default: false,
}

let breakConditions = {
	"default": `game.keyboard.isDown('Alt')`,
}

function updateBreakConditions() {
	function prep(key) {
		if (isEmpty(breakConditions[key])) {
			return ""
		} else {
			return breakConditions[key]
		}
	}
	
	breakOverlayRender = function (token) {
		return new Function(`token`,
			`return
				${prep("default")}
				${prep("onlyGM")} ${prep("onlyNPCs")}
				${prep("system")}
			`.replace(/\n^\s+/gm, " ")
		)(token)
	}
}

export function updateBreakSettings() {
	breakConditions["onlyGM"] = game.settings.get("healthEstimate", "core.onlyGM") ? `|| !game.user.isGM` : ``
	breakConditions["onlyNPCs"] = game.settings.get("healthEstimate", "core.onlyNPCs") ? `|| token.actor.isPC` : ``
	updateBreakConditions()
}

export function prepareSystemSpecifics() {
	return new Promise((resolve, reject) => {
			console.log(game.system.id)
			switch (game.system.id) {
				case "archmage":
				case "dnd5e":
					fractionFormula = function (token) {
						const hp = token.actor.data.data.attributes.hp
						let addTemp = 0
						if (token.actor.data.type === "character" && game.settings.get("healthEstimate", "core.addTemp")) addTemp = 1
						return Math.min((hp.temp * addTemp + hp.value) / hp.max, 1)
					}
					systemSpecificSettings["core.addTemp"] = tempHPSetting
					break
				case "blades-in-the-dark":
					fractionFormula = function (token) {
						const hp = token.actor.data.data.harm
						let harmLevel = 0
						for (let [key, value] of Object.entries(hp)) {
							for (let entry of Object.values(value)) {
								if (!isEmpty(entry)) {  //Testing for empty or whitespace
									switch (key) {
										case "light":
											harmLevel += 1
											break
										case "medium":
											harmLevel += 3
											break
										case "heavy":
											harmLevel += 9
											break
										case "deadly":
											return 0
									}
								}
							}
						}
						return 1 - (harmLevel / 18)
					}
					breakConditions["system"] = `||token.actor.data.type === "crew"`
					break
				case "dungeonworld":
					fractionFormula = function (token) {
						const hp = token.actor.data.data.attributes.hp
						return Math.min(hp.value / hp.max, 1)
					}
					break
				case "fate":
					fractionFormula = function (token) {
						switch (token.actor.data.type) {
							case "Accelerated": {
								let hitCounter = 6
								for (let [key, value] of Object.entries(token.actor.data.data.health.cons)) {
									if (value.value !== "") hitCounter -= 1
								}
								for (let [key, value] of Object.entries(token.actor.data.data.health.stress)) {
									hitCounter -= 1 * value
								}
								return hitCounter / 6
							}
							case "Core": {
								//TODO: Add actual logic when necessary variables are added to the token
							}
						}
					}
					breakConditions["system"] = `||token.actor.data.type !== "Accelerated"`
					break
				case "numenera":
					fractionFormula = function (token) {
						const [might, speed, intellect] = token.actor.data.data.stats
						if (token.actor.data.type === "character") {
							if (game.settings.get("healthEstimate", "numenera.countPools")) {
								let fullPools = 3
								for (let pool of [might, speed, intellect]) {
									if (pool.pool.current === 0) {
										fullPools -= 1
									}
								}
								return fullPools / 3
							} else {
								let [total, max] = [0, 0]
								for (let pool of [might, speed, intellect]) {
									total += pool.pool.current
									max += pool.pool.maximum
								}
								return total / max
							}
						} else {
							const hp = token.actor.data.data.health
							return hp.current / hp.max
						}
					}
					systemSpecificSettings["numenera.countPools"] = {
						type:    Boolean,
						default: false,
					}
					break
				case "pf1":
					fractionFormula = function (token) {
						const hp = token.actor.data.data.attributes.hp
						let addTemp = 0
						if (game.settings.get("healthEstimate", "core.addTemp")) addTemp = 1
						return Math.min((hp.value - hp.nonlethal + (hp.temp * addTemp)) / hp.max, 1)
					}
					systemSpecificSettings["core.addTemp"] = tempHPSetting
					systemSpecificSettings["PF1.showExtra"] = {
						type:    Boolean,
						default: true,
					}
					systemSpecificSettings["PF1.disabledName"] = {
						type:    String,
						default: t("PF1.disabledName.default")
					}
					systemSpecificSettings["PF1.dyingName"] = {
						type:    String,
						default: t("PF1.dyingName.default")
					}
					break
				case "pf2e":
					fractionFormula = function (token) {
						const hp = token.actor.data.data.attributes.hp
						let addTemp = 0
						if (game.settings.get("healthEstimate", "core.addTemp")) addTemp = 1
						return Math.min((hp.value + (hp.temp * addTemp)) / hp.max, 1)
					}
					systemSpecificSettings["core.addTemp"] = tempHPSetting
					systemSpecificSettings.delete("deathState")
					systemSpecificSettings.delete("deathMarker")
					break
				case "shadowrun5e":
					fractionFormula = function (token) {
						const [stun, physical] = token.actor.data.data.track
						return Math.min(
							(stun.max - stun.value) / stun.max,
							(physical.max - physical.value) / physical.max
						)
					}
					break
				case "starfinder":
					fractionFormula = function (token) {
						const type = token.actor.data.type
						return () => { //wrapping inner switch so it doesn't cause problems
							const hp = token.actor.data.data.attributes.hp
							switch (type) {
								case "npc":
								case "character": {
									const sp = token.actor.data.data.attributes.sp
									const addStamina = game.settings.get("healthEstimate", "starfinder.addStamina") ? 1 : 0
									const temp = game.settings.get("healthEstimate", "core.addTemp") && (type === "character") ? hp.temp : 0
									return Math.min((hp.value + (sp.value * addStamina) + temp) / (hp.max + (sp.max * addStamina)), 1)
								}
								case "vehicle": {
									if (game.settings.get("healthEstimate", "starfinder.useThreshold")) {
										if (hp.value > hp.threshold) {
											return 1
										} else if (hp.value > 0) {
											return 0.5
										} else {
											return 0
										}
									} else {
										return hp.value / hp.max
									}
								}
								case "starship": {
									return hp.value / hp.max
								}
							}
						}
					}
					systemSpecificSettings["core.addTemp"] = tempHPSetting
					systemSpecificSettings["starfinder.addStamina"] = {
						type:    Boolean,
						default: true,
					}
					systemSpecificSettings["starfinder.useThreshold"] = {
						type:    Boolean,
						default: false,
					}
					systemSpecificSettings["starfinder.thresholdNames"] = {
						type:    String,
						default: t("starfinder.thresholdNames.default").join(", "),
					}
					systemSpecificSettings["starfinder.vehicleNames"] = {
						type:    String,
						default: t("starfinder.vehicleNames.default").join(", "),
					}
					break
				case "swade":
					fractionFormula = function (token) {
						const hp = token.actor.data.data.wounds
						return (hp.max - hp.value) / hp.max
					}
					break
				case "wfrp4e":
					fractionFormula = function (token) {
						const hp = token.actor.data.data.status.wounds
						return hp.value / hp.max
					}
					break
				case "worldbuilding":
					fractionFormula = function (token) {
						/* Can't think of a different way to do it that doesn't involve FS manipulation, which is its own can of worms */
						const setting = game.settings.get("healthEstimate", "worldbuilding.simpleRule")
						return Function('token', setting)(token)
					}
					systemSpecificSettings["worldbuilding.simpleRule"] = {
						type:    String,
						default: t("worldbuilding.simpleRule.default"),
					}
					break
				case "default":
					reject("Invalid System")
			}
			resolve("success")
		}
	)
}
