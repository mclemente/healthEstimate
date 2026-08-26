import { t } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class starwarsffgEstimationProvider extends EstimationProvider {
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

	filteredTypes = ["hazard"];

	vehicleConfig = true;

	fraction(token) {
		let hp = token.actor.system.stats.wounds;
		if (token.actor.type === "vehicle") {
			hp = token.actor.system.stats.hullTrauma;
		}
		return Math.min((hp.max - hp.value) / hp.max, 1);
	}

	breakAttribute(token) {
		return this.isVehicle(token)
			? token.actor.system.attributes.hullTrauma.max
			: token.actor.system.stats.wounds.max;
	}
}
