import EstimationProvider from "./templates/Base.js";

const { SetField, StringField } = foundry.data.fields;

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

	extraEstimationFields = {
		creatureTypes: new SetField(new StringField({
			choices: Object.values(CONFIG.D35E.creatureTypes),
			validationError: "must be a value in CONFIG.D35E.creatureTypes",
		}), {
			label: "healthEstimate.DND5E.creatureTypes",
			stacked: true
		}),
		customCreatureTypes: new SetField(new StringField(), {
			label: "healthEstimate.DND5E.customCreatureTypes",
			stacked: true
		}),
	};

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

	getTokenEstimate(token, estimation) {
		const { creatureTypes, customCreatureTypes } = estimation;
		const { type } = token.actor.system.details;
		const types = new Set(type ? type.split(",").map((type) => type.trim()) : "");

		if (creatureTypes.size && creatureTypes.intersects(types)) return true;
		if (customCreatureTypes.size && customCreatureTypes.intersects(types)) return true;
		return super.getTokenEstimate(token, estimation);
	}
}
