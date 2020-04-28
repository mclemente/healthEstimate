export function getHealthFraction(token) {
	switch (game.system.id) {
		case "archmage":
		case "dnd5e": {
			const hp = token.actor.data.data.attributes.hp;
			let addTemp = 0;
			if (token.actor.data.type === "character" && game.settings.get("healthEstimate", "addTemp")) addTemp = 1;
			return Math.min((hp.temp * addTemp + hp.value) / hp.max, 1);
		}
		case "dungeonworld": {
			const hp = token.actor.data.data.attributes.hp;
			return Math.min(hp.value / hp.max, 1);
		}
		case "fate": {
			let hitCounter = 6;
			for (let [key, value] of Object.entries(token.actor.data.data.health.cons)) {
				if (value !== "") hitCounter -= 1;
			}
			for (let [key, value] of Object.entries(token.actor.data.data.health.stress)) {
				hitCounter -= 1 * value;
			}
			return hitCounter / 6;
		}
		case "numenera": {
			const [might, speed, intellect] = token.actor.data.data.stats;
			if (token.actor.data.type === "character"){
				if (game.settings.get("healthEstimate", "countPools")) {
					let fullPools = 3;
					for (let pool of [might, speed, intellect]) {
						if (pool.pool.current === 0) {
							fullPools -= 1;
						}
					}
					return  fullPools / 3;
				} else {
					let [total,max] = [0,0];
					for (let pool of [might, speed, intellect]) {
						total += pool.pool.current;
						max   += pool.pool.maximum;
					}
					return total/max;
				}
			} else {
				const hp = token.actor.data.data.health;
				return hp.current / hp.max;
			}
		}
		case "pf1": {
			const hp = token.actor.data.data.attributes.hp;
			let addTemp = 0;
			if (game.settings.get("healthEstimate", "addTemp")) addTemp = 1;
			return Math.min((hp.value - hp.nonlethal + (hp.temp * addTemp)) / hp.max, 1);
		}
		case "pf2e": {
			const hp = token.actor.data.data.attributes.hp;
			let addTemp = 0;
			if (game.settings.get("healthEstimate", "addTemp")) addTemp = 1;
			return Math.min((hp.value + (hp.temp * addTemp)) / hp.max, 1);
		}
		case "shadowrun5e": {
			const [stun, physical] = token.actor.data.data.track;
			return Math.min(
				(stun.max - stun.value) / stun.max,
				(physical.max - physical.value) / physical.max
			)
		}
		case "starfinder": {
			const type = token.actor.data.type;
			return () => { //wrapping inner switch so it doesn't cause problems
				switch (type) {
					case "npc":
					case "character": {
						const hp = token.actor.data.data.attributes.hp;
						const sp = token.actor.data.data.attributes.sp;
						const addStamina = game.settings.get("healthEstimate", "addStamina") ? 1 : 0;
						const temp = game.settings.get("healthEstimate", "addTemp") && (type === "character") ? hp.temp : 0;
						return Math.min((hp.value + (sp.value * addStamina) + temp) / (hp.max + (sp.max * addStamina)), 1);
					}
					case "vehicle": {
						const hp = token.actor.data.data.attributes.hp;
						if (game.settings.get("healthEstimate", "useThreshold")) {
							if (hp.value > hp.threshold) {
								return 1
							} else if (hp.value > 0) {
								return 0.5
							} else {
								return 0
							}
						} else {
							return hp.value / hp.max;
						}
					}
					case "starship": {
						const hp = token.actor.data.data.attributes.hp;
						return hp.value / hp.max
					}
				}
			}
		}
		case "swade": {
			const hp = token.actor.data.data.wounds;
			return (hp.max - hp.value) / hp.max
		}
		case "wfrp4e": {
			const hp = token.actor.data.data.status.wounds;
			return hp.value / hp.max
		}
		case "worldbuilding": {
			/* Can't think of a different way to do it that doesn't involve FS manipulation, which is its own can of worms */
			eval(game.settings.get("healthEstimate","simpleRule"))
		}
	}
}
