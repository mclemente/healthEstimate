import { t } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class starwarsffgEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.vehicleRules = {
			config: true,
			vehicles: ["vehicle"],
		};
		this.breakOnZeroMaxHP = true;
		this.estimations = [
			...this.estimations,
			{
				name: "Vehicles",
				rule: "type === \"vehicle\"",
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
		let hp = token.actor.system.stats.wounds;
		if (token.actor.type === "vehicle") {
			hp = token.actor.system.stats.hullTrauma;
		}
		return Math.min((hp.max - hp.value) / hp.max, 1);
	}

	get breakCondition() {
		let str = "false";
		if (!["false", "none"].includes(game.settings.get("healthEstimate", "core.breakOnZeroMaxHP"))) {
			str = `
				(token.actor.type === 'vehicle' && token.actor.system.stats.hullTrauma.max ${this.breakMaxHPValue})
				|| (token.actor.type !== 'vehicle' && token.actor.system.stats.wounds.max ${this.breakMaxHPValue})
			`;
		}
		return `
        || ${this.isVehicle} && game.settings.get('healthEstimate', 'core.hideVehicleHP')
        || token.actor.type === 'hazard'
        || ${str}`;
	}
}
