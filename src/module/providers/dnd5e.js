import { sGet, t } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class dnd5eEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.vehicleRules = {
			config: true,
			vehicles: ["vehicle"],
		};
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
		const hp = token.actor.system.attributes.hp;
		let temp = 0;
		if (token.actor.type === "character" && sGet("core.addTemp")) {
			temp = hp.temp;
		}
		return Math.min((temp + hp.value) / hp.max, 1);
	}

	get breakCondition() {
		return `
        || ${this.isVehicle} && game.settings.get('healthEstimate', 'core.hideVehicleHP')
		|| token.actor.type == 'group'
		|| token.actor.system.attributes.hp.max === null
		|| (game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.attributes.hp.max === 0)`;
	}
}
