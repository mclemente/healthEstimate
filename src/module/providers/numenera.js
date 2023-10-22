import { sGet } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class numeneraEstimationProvider extends EstimationProvider {
	fraction(token) {
		if (token.actor.type === "pc") {
			const might = token.actor.system.stats.might;
			const speed = token.actor.system.stats.speed;
			const intellect = token.actor.system.stats.intellect;
			if (sGet("numenera.countPools")) {
				let fullPools = 3;
				for (let pool of [might, speed, intellect]) {
					if (pool.pool.current === 0) {
						fullPools -= 1;
					}
				}
				return fullPools / 3;
			} else {
				let [total, max] = [0, 0];
				for (let pool of [might, speed, intellect]) {
					total += pool.pool.current;
					max += pool.pool.maximum;
				}
				return total / max;
			}
		} else {
			const hp = token.actor.system.health;
			return hp.current / hp.max;
		}
	}

	get settings() {
		return {
			"numenera.countPools": {
				type: Boolean,
				default: false,
			},
		};
	}
}
