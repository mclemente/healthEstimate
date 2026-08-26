import { sGet, t } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class t2k4eEstimationProvider extends EstimationProvider {
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

	filteredTypes = ["party", "unit"];

	vehicleConfig = true;

	fraction(token) {
		const type = token.actor.type;
		let hp;
		if (type === "vehicle") {
			hp = token.actor.system.reliability;
		} else {
			hp = token.actor.system.health;
		}
		let temp = 0;
		if (type !== "vehicle" && sGet("core.addTemp")) {
			temp = hp.temp;
		}
		return Math.min((temp + hp.value) / hp.max, 1);
	}

	breakAttribute(token) {
		return this.isVehicle(token)
			? token.actor.system.reliability.max
			: token.actor.system.health.max;
	}
}
