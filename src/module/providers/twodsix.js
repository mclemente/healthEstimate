import { t } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class twodsixEstimationProvider extends EstimationProvider {
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
			actorTypes: ["vehicle", "ship"]
		},
	];

	filteredTypes = ["world"];

	vehicleRules = {
		config: true,
		vehicles: ["vehicle", "ship"],
	};

	fraction(token) {
		switch (token.actor.type) {
			case "traveller":
			case "robot":
			case "animal": {
				const hp = token.actor.system.hits;
				return hp.value / hp.max;
			}
			case "ship": {
				const hp = token.actor.system.shipStats.hull;
				return hp.value / hp.max;
			}
			case "space-object": {
				const hp = token.actor.system.count;
				return hp.value / hp.max;
			}
			case "vehicle": {
				let max = 0;
				let current = 0;
				const status = token.actor.system.systemStatus;
				for (let sys in status) {
					switch (status[sys]) {
						case "operational": {
							max += 2;
							current += 2;
							break;
						}
						case "damaged": {
							max += 2;
							current += 1;
							break;
						}
						case "destroyed": {
							max += 2;
							break;
						}
						case "off": {
							break;
						}
					}
				}
				return current / max;
			}
		}
	}

	breakAttribute(token) {
		return token.actor.system?.hits?.max
			?? token.actor.system?.shipStats?.hull.max
			?? token.actor.system?.count?.max;
	}
}
