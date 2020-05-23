import {isEmpty}        from "./utils.js"
import * as dnd5e       from "./systems/dnd5e.js"
import * as systems     from "./systems.js"
import {updateSettings} from "./logic.js"

console.log(systems["dnd5e"])

export let fractionFormula
export let breakOverlayRender
export let systemSpecificSettings = {
	"core.deathState":  {
		"type":    Boolean,
		"default": false,
		onChange: s => { updateSettings() }
	},
	"core.deathMarker": {
		type:    String,
		default: "icons/svg/skull.svg",
		onChange: s => { updateSettings() }
	}
}
export let descriptionToShow = function (descriptions, stage, token) {
	return descriptions[stage]
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
			
			let systemID = game.system.id
			switch (systemID) {
				case "archmage":
					systemID = "dnd5e"
					break
				case "blades-in-the-dark":
					systemID = "bitd"
					break
				case "pf2e":
					systemSpecificSettings["core.deathState"].config = false
					systemSpecificSettings["core.deathMarker"].config = false
					break
			}
			
			const currentSystem = systems[systemID]
			fractionFormula = currentSystem.fraction
			if (currentSystem.settings !== undefined) {
				systemSpecificSettings = Object.assign(systemSpecificSettings, currentSystem.settings())
			}
			if (currentSystem.breakCondition !== undefined) {
				breakConditions["system"] = currentSystem.breakCondition
			}
			if (currentSystem.descriptions !== undefined) {
				descriptionToShow = currentSystem.descriptions
			}
			resolve("success")
		}
	)
}
