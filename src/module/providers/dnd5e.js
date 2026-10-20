import { sGet, t } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

const { SetField, StringField } = foundry.data.fields;

export default class dnd5eEstimationProvider extends EstimationProvider {
	addTemp = true;

	breakOnZeroMaxHP = "zero";

	estimations = [
		...this.estimations,
		{
			name: "Vehicles",
			estimates: [
				{ value: 0, label: t("core.estimates.vehicles.0") },
				{ value: 20, label: t("core.estimates.vehicles.1") },
				{ value: 40, label: t("core.estimates.vehicles.2") },
				{ value: 60, label: t("core.estimates.vehicles.3") },
				{ value: 80, label: t("core.estimates.vehicles.4") },
				{ value: 100, label: t("core.estimates.vehicles.5") },
			],
			actorTypes: ["vehicle"]
		},
	];

	extraEstimationFields = {
		creatureTypes: new SetField(new StringField({
			choices: Object.fromEntries(
				Object.entries(CONFIG.DND5E.creatureTypes)
					.map(([key, data]) => ([key, data.label]))),
			validationError: "must be a value in CONFIG.DND5E.creatureTypes",
		}), {
			label: "healthEstimate.DND5E.creatureTypes",
			stacked: true
		}),
		customCreatureTypes: new SetField(new StringField(), {
			label: "healthEstimate.DND5E.customCreatureTypes",
			stacked: true
		}),
	};

	filteredTypes = ["encounter", "group"];

	vehicleConfig = true;

	fraction(token) {
		const hp = token.actor.system.attributes.hp;
		if (token.actor.type === "character" && sGet("core.addTemp")) {
			return Math.min(hp.pct/100, 1);
		}
		return Math.min(hp.value / hp.effectiveMax, 1);
	}

	breakCondition(token) {
		return super.breakCondition(token) || this.breakAttribute(token) === null;
	}

	getTokenEstimate(token, estimation) {
		const { creatureTypes, customCreatureTypes } = estimation;
		const { subtype, custom } = token.actor.system.details.type;
		const slugs = new Set([...customCreatureTypes].map((s) => s.slugify()));

		if (creatureTypes.size && creatureTypes.has(subtype)) return true;
		if (slugs.size && slugs.has((custom ?? "").slugify())) return true;
		return super.getTokenEstimate(token, estimation);
	}
}
