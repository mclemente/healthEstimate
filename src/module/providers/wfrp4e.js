import { t } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class wfrp4eEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.vehicleRules.config = true;
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
		const hp = token.actor.system.status.wounds;
		return hp.value / hp.max;
	}

	get breakCondition() {
		return `
        || ${this.isVehicle} && game.settings.get('healthEstimate', 'core.hideVehicleHP')
		|| (game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.status.wounds === 0)`;
	}
}
