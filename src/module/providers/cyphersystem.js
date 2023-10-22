import { sGet } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class cyphersystemEstimationProvider extends EstimationProvider {
	fraction(token) {
		const actor = token.actor;
		if (actor.type === "pc") {
			const pools = actor.system.pools;
			let curr = pools.might.value + pools.speed.value + pools.intellect.value;
			let max = pools.might.max + pools.speed.max + pools.intellect.max;
			if (actor.system.settings.general.additionalPool.active) {
				curr += pools.additional.value;
				max += pools.additional.max;
			}
			const result = Math.min(1, curr / max);
			let limit = 1;

			switch (actor.system.combat.damageTrack.state) {
				case "Impaired":
					limit = sGet("cyphersystem.impaired");
					break;
				case "Debilitated":
					limit = sGet("cyphersystem.debilitated");
					break;
			}
			return Math.min(result, limit);
		} else if (actor.system.pools?.health) {
			let hp = actor.system.pools.health;
			return hp.value / hp.max;
		}
	}

	get settings() {
		return {
			"cyphersystem.impaired": {
				type: Number,
				default: 0.5,
			},
			"cyphersystem.debilitated": {
				type: Number,
				default: 0.1,
			},
		};
	}

	get breakCondition() {
		return "|| ![ 'pc', 'npc', 'companion','community' ].includes(token.actor.type)";
	}
}
