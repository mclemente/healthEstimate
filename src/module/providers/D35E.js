import EstimationProvider from "./templates/Base.js";

export default class D35EEstimationProvider extends EstimationProvider {
	addTemp = true;

	breakOnZeroMaxHP = "zero";

	estimations = [
		...this.estimations,
		{
			name: "Objects",
			estimates: [
				{ value: 0, label: _loc("healthEstimate.core.estimates.vehicles.0") },
				{ value: 20, label: _loc("healthEstimate.core.estimates.vehicles.1") },
				{ value: 40, label: _loc("healthEstimate.core.estimates.vehicles.2") },
				{ value: 60, label: _loc("healthEstimate.core.estimates.vehicles.3") },
				{ value: 80, label: _loc("healthEstimate.core.estimates.vehicles.4") },
				{ value: 100, label: _loc("healthEstimate.core.estimates.vehicles.5") },
			],
			actorTypes: ["object"]
		},
		{
			name: _loc("D35E.Disabled"),
			ignoreColor: true,
			estimates: [{ value: 100, label: _loc("D35E.Disabled") }],
			statusEffects: ["disabled"]
		},
		{
			name: _loc("D35E.Staggered"),
			ignoreColor: true,
			estimates: [{ value: 100, label: _loc("D35E.Staggered") }],
			statusEffects: ["staggered"]
		},
		{
			name: _loc("D35E.Unconscious"),
			ignoreColor: true,
			estimates: [{ value: 100, label: _loc("D35E.Unconscious") }],
			statusEffects: ["unconscious"]
		},
	];

	filteredTypes = ["trap"];

	organicTypes = ["character", "npc"];

	vehicleTypes = ["object"];

	fraction(token) {
		const hp = token.actor.system.attributes.hp;
		let addTemp = 0;
		let addNonlethal = 0;
		if (game.settings.get("healthEstimate", "core.addTemp")) {
			addTemp = hp.temp;
		}
		if (game.settings.get("healthEstimate", "PF1.addNonlethal")) {
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
