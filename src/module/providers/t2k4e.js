import { sGet, t } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class t2k4eEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.vehicleRules.config = true;
		this.addTemp = true;
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
		const type = token.actor.type;
		let hp;
		if (type === "vehicle") {
			hp = token.actor.system.reliability;
		} else {
			hp = token.actor.system.health.toughness;
		}
		let temp = 0;
		if (type !== "vehicle" && sGet("core.addTemp")) {
			temp = hp.temp;
		}
		return Math.min((temp + hp.value) / hp.max, 1);
	}

	get breakCondition() {
		return `
        || ${this.isVehicle} && game.settings.get('healthEstimate', 'core.hideVehicleHP')
		|| token.actor.type == "unit"
		|| token.actor.type == "party"
		|| game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.health.toughness.max === 0`;
	}
}
