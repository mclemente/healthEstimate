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
	}
}
