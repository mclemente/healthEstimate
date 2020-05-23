const fraction = function (token) {
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
const settings = ()=> {
	return {
		"numenera.countPools": {
			type:    Boolean,
			default: false,
		}
	}
}

export {fraction, settings}