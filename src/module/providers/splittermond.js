import EstimationProvider from "./templates/Base.js";

export default class splittermondEstimationProvider extends EstimationProvider {
	breakOnZeroMaxHP = "zero";

	estimations = [
		// Default: 5 Gesundheitsstufen (standard)
		// Boundaries at 80/60/40/20% of max HP
		{
			name: "",
			ignoreColor: false,
			estimates: [
				{ value: 19, label: _loc("splittermond.woundMalusLevels.doomed") },
				{ value: 39, label: _loc("splittermond.woundMalusLevels.badlyinjured") },
				{ value: 59, label: _loc("splittermond.woundMalusLevels.injured") },
				{ value: 79, label: _loc("splittermond.woundMalusLevels.battered") },
				{ value: 100, label: _loc("splittermond.woundMalusLevels.notinjured") },
			],
		},
	];

	fraction(token) {
		const hp = token.actor.system.health;
		return hp.total.value / hp.max;
	}

	breakAttribute(token) {
		return token.actor.system.health.max;
	}
}
