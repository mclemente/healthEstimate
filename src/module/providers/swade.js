import EstimationProvider from "./templates/Base.js";

const { SetField, StringField } = foundry.data.fields;

export default class swadeEstimationProvider extends EstimationProvider {
	deathStateName = _loc("SWADE.Incap");

	estimations = [
		{
			estimates: [
				{ value: 0, label: _loc("SWADE.Incap") },
				{ value: 25, label: _loc("healthEstimate.core.estimates.states.1") },
				{ value: 50, label: _loc("healthEstimate.core.estimates.states.2") },
				{ value: 99, label: _loc("healthEstimate.core.estimates.states.3") },
				{ value: 100, label: _loc("healthEstimate.core.estimates.states.5") },
			],
		},
		{
			name: "Vehicles",
			estimates: [
				{ value: 0, label: _loc("healthEstimate.core.estimates.vehicles.0") },
				{ value: 20, label: _loc("healthEstimate.core.estimates.vehicles.1") },
				{ value: 40, label: _loc("healthEstimate.core.estimates.vehicles.2") },
				{ value: 60, label: _loc("healthEstimate.core.estimates.vehicles.3") },
				{ value: 80, label: _loc("healthEstimate.core.estimates.vehicles.4") },
				{ value: 100, label: _loc("healthEstimate.core.estimates.vehicles.5") },
			],
			actorTypes: ["vehicle"]
		},
	];

	extraEstimationFields = {
		swid: new SetField(new StringField(), {
			label: "SWADE.SWID.Long",
			stacked: true
		}),
	};

	vehicleConfig = true;

	fraction(token) {
		const hp = token.actor.system.wounds;
		let maxHP = Math.max(hp.max, 1);
		if (hp.max || token.actor.system.wildcard) {
			const defaultWildCardMaxWounds = game.settings.get("healthEstimate", "swade.defaultWildCardMaxWounds");
			maxHP = 1 + (hp.max || defaultWildCardMaxWounds);
		}
		return (maxHP - hp.value) / maxHP;
	}

	get settings() {
		return {
			"swade.defaultWildCardMaxWounds": {
				type: Number,
				default: 3,
				range: {
					min: 1,
					max: 10,
				},
			},
		};
	}

	getTokenEstimate(token, estimation) {
		const { swid } = estimation;

		if (swid.size && token.actor.items.some((i) => swid.has(i.system.swid))) return true;
		return super.getTokenEstimate(token, estimation);
	}

	tokenEffects(token) {
		return token.actor.statuses.intersects(new Set(["incapacitated", "dead"]));
	}
}
