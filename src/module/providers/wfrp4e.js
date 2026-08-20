import { t } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class wfrp4eEstimationProvider extends EstimationProvider {
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

	vehicleRules = {
		config: true,
		vehicles: ["vehicle"],
	};

	fraction(token) {
		const hp = token.actor.system.status.wounds;
		return hp.value / hp.max;
	}

	breakAttribute(token) {
		return token.actor.system.status.wounds;
	}
}
