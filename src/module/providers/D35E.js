import { sGet } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class D35EEstimationProvider extends EstimationProvider {
	addTemp = true;

	breakOnZeroMaxHP = "zero";

	estimations = [
		...this.estimations,
		{
			name: game.i18n.localize("D35E.Disabled"),
			ignoreColor: true,
			estimates: [{ value: 100, label: game.i18n.localize("D35E.Disabled") }],
			statusEffects: ["disabled"]
		},
		{
			name: game.i18n.localize("D35E.Staggered"),
			ignoreColor: true,
			estimates: [{ value: 100, label: game.i18n.localize("D35E.Staggered") }],
			statusEffects: ["staggered"]
		},
		{
			name: game.i18n.localize("D35E.Unconscious"),
			ignoreColor: true,
			estimates: [{ value: 100, label: game.i18n.localize("D35E.Unconscious") }],
			statusEffects: ["unconscious"]
		},
	];

	fraction(token) {
		const hp = token.actor.system.attributes.hp;
		let addTemp = 0;
		let addNonlethal = 0;
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
