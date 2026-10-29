import EstimationProvider from "./templates/Base.js";

export default class weirdwizardEstimationProvider extends EstimationProvider {
	deathStateName = _loc("WW.Health.Estimation.Dead");

	estimations = [
		{
			estimates: [
				{ value: 0, label: _loc("WW.Health.Estimation.100") },
				{ value: 25, label: _loc("WW.Health.Estimation.75") },
				{ value: 50, label: _loc("WW.Health.Estimation.50") },
				{ value: 75, label: _loc("WW.Health.Estimation.25") },
				{ value: 99.99, label: _loc("WW.Health.Estimation.1") },
				{ value: 100, label: _loc("WW.Health.Estimation.0") }
			],
		},
	];

	fraction(token) {
		const hp = token.actor.system.stats.damage;
		return (hp.max - hp.value) / hp.max;
	}
}
