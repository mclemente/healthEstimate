import { t } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class alienrpgEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.vehicleRules = {
			config: true,
			vehicles: ["vehicles", "spacecraft"],
		};
		this.breakOnZeroMaxHP = true;
		this.estimations = [
			...this.estimations,
			{
				name: "Vehicles & Spaceships",
				rule: "type === \"vehicles\" || type === \"spacecraft\"",
				estimates: [
					{ value: 0, label: t("core.estimates.vehicles.0") },
					{ value: 20, label: t("core.estimates.vehicles.1") },
					{ value: 40, label: t("core.estimates.vehicles.2") },
					{ value: 60, label: t("core.estimates.vehicles.3") },
					{ value: 80, label: t("core.estimates.vehicles.4") },
					{ value: 100, label: t("core.estimates.vehicles.5") },
				],
			},
		];
	}

	fraction(token) {
		if (token.actor.type === "vehicles") {
			const hull = token.actor.system.attributes.hull;
			return hull.value / hull.max;
		} else if (token.actor.type === "spacecraft") {
			const hull = token.actor.system.attributes.hull.value;
			const damage = token.actor.system.attributes.damage.value;
			return (hull - damage) / hull;
		} else {
			const hp = token.actor.system.header.health;
			return hp.value / hp.max;
		}
	}

	get breakCondition() {
		return `
		|| ${this.isVehicle} && game.settings.get('healthEstimate', 'core.hideVehicleHP')
		|| (game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP')
			&& (
				(${this.isVehicle} && token.actor.system.attributes.hull.max === 0)
				|| (!${this.isVehicle} && token.actor.system.header.health.max === 0)
			)
		)`;
	}
}
