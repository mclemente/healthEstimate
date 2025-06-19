import { sGet, t } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class sfrpgEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.organicTypes.push("npc2");
		this.vehicleRules = {
			config: true,
			vehicles: ["starship", "vehicle"],
		};
		this.addTemp = true;
		this.breakOnZeroMaxHP = true;
		this.estimations = [
			...this.estimations,
			{
				name: "Vehicle Threshold",
				rule: "type === \"vehicle\" && game.settings.get(\"healthEstimate\", \"starfinder.useThreshold\")",
				estimates: [
					{ value: 0, label: t("core.estimates.thresholds.0") },
					{ value: 50, label: t("core.estimates.thresholds.1") },
					{ value: 100, label: t("core.estimates.thresholds.2") },
				],
			},
			{
				name: "Vehicles, Starships & Drones",
				rule: "[\"starship\", \"vehicle\", \"drone\"].includes(type)",
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
		const hp = token.actor.system.attributes.hp;
		switch (type) {
			case "npc":
			case "npc2":
			case "drone": {
				const temp = sGet("core.addTemp") ? hp.temp ?? 0 : 0;
				return Math.min((hp.value + temp) / hp.max, 1);
			}
			case "character": {
				const sp = token.actor.system.attributes.sp;
				const addStamina = sGet("starfinder.addStamina") ? 1 : 0;
				const temp = sGet("core.addTemp") ? hp.temp ?? 0 : 0;
				return Math.min((hp.value + (sp.value * addStamina) + temp) / (hp.max + (sp.max * addStamina)), 1);
			}
			case "vehicle":
				if (sGet("starfinder.useThreshold")) {
					if (hp.value > hp.threshold) return 1;
					else if (hp.value > 0) return 0.5;
					return 0;
				}
			// eslint-disable-next-line no-fallthrough
			case "starship":
				return hp.value / hp.max;
		}
	}

	get settings() {
		return {
			"starfinder.addStamina": {
				type: Boolean,
				default: true,
			},
			"starfinder.useThreshold": {
				type: Boolean,
				default: false,
			},
		};
	}

	get breakCondition() {
		return `
        || ${this.isVehicle} && game.settings.get('healthEstimate', 'core.hideVehicleHP')
        || token.actor.type === 'hazard'
        ${super.breakCondition}`;
	}
}
