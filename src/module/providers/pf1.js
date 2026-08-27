import { sGet } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class pf1EstimationProvider extends EstimationProvider {
	addTemp = true;

	breakOnZeroMaxHP = "zero";

	estimations = [
		...this.estimations,
		{
			name: _loc("PF1.Condition.staggered"),
			ignoreColor: true,
			estimates: [{ value: 100, label: _loc("PF1.Condition.staggered") }],
			statusEffects: ["staggered"]
		},
		{
			name: _loc("PF1.Condition.dying"),
			ignoreColor: true,
			estimates: [{ value: 100, label: _loc("PF1.Condition.dying") }],
			statusEffects: ["dying"]
		},
	];

	fraction(token) {
		const { variants } = game.settings.get("pf1", "healthConfig");
		const hp = token.actor.system.attributes.hp;
		let addTemp = 0;
		let addNonlethal = 0;

		if ((token.actor.type === "character" && variants.pc.useWoundsAndVigor)
			|| (token.actor.type === "npc" && variants.npc.useWoundsAndVigor)) {
			const vigor = token.actor.system.attributes.vigor;
			const wounds = token.actor.system.attributes.wounds;
			if (sGet("core.addTemp")) {
				addTemp = vigor.temp;
			}
			return (vigor.value + wounds.value + addTemp) / (vigor.max + wounds.max);
		}
		if (sGet("core.addTemp")) {
			addTemp = hp.temp;
		}
		if (sGet("PF1.addNonlethal")) {
			addNonlethal = hp.nonlethal;
		}
		return (hp.value - addNonlethal + addTemp) / hp.max;
	}

	get settings() {
		return {
			"PF1.addNonlethal": {
				type: Boolean,
				default: true,
			},
		};
	}
}
