import { t } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class alienrpgEstimationProvider extends EstimationProvider {
	breakOnZeroMaxHP = "zero";

	estimations = [
		...this.estimations,
		{
			name: "Vehicles & Spaceships",
			estimates: [
				{ value: 0, label: t("core.estimates.vehicles.0") },
				{ value: 20, label: t("core.estimates.vehicles.1") },
				{ value: 40, label: t("core.estimates.vehicles.2") },
				{ value: 60, label: t("core.estimates.vehicles.3") },
				{ value: 80, label: t("core.estimates.vehicles.4") },
				{ value: 100, label: t("core.estimates.vehicles.5") },
			],
			actorTypes: ["vehicle", "spacecraft"]
		},
	];

	vehicleConfig = true;

	vehicleTypes = ["vehicles", "spacecraft"];

	fraction(token) {
		if (token.actor.type === "vehicles") {
			const hull = token.actor.system.attributes.hull;
			return hull.value / hull.max;
		} else if (token.actor.type === "spacecraft") {
			const hull = token.actor.system.attributes.hull.value;
			const damage = token.actor.system.attributes.damage.value;
			return (hull - damage) / hull;
		}
		const hp = token.actor.system.header.health;
		return hp.value / hp.max;
	}

	breakAttribute(token) {
		return this.isVehicle(token)
			? token.actor.system.attributes.hull.max
			: token.actor.system.header.health.max;
	}
}
