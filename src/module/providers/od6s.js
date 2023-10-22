import { t } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class od6sEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.vehicleRules = {
			config: true,
			vehicles: ["vehicle", "starship"],
		};
		this.estimations = [
			...this.estimations,
			{
				name: "Vehicles",
				rule: "type === \"vehicle\" || type === \"starship\"",
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
		switch (type) {
			case "npc":
			case "creature":
			case "character": {
				const od6swounds = token.actor.system.wounds.value;
				return 1 - (od6swounds / 6);
			}
			case "vehicle":
			case "starship": {
				const od6sdamagestring = token.actor.system.damage.value;
				let od6sdamage;
				switch (od6sdamagestring) {
					case "OD6S.DAMAGE_NONE":
						od6sdamage = 0;
						break;
					case "OD6S.DAMAGE_VERY_LIGHT":
						od6sdamage = 1;
						break;
					case "OD6S.DAMAGE_LIGHT":
						od6sdamage = 2;
						break;
					case "OD6S.DAMAGE_HEAVY":
						od6sdamage = 3;
						break;
					case "OD6S.DAMAGE_SEVERE":
						od6sdamage = 4;
						break;
					case "OD6S.DAMAGE_DESTROYED":
						od6sdamage = 5;
				}
				return 1 - (od6sdamage / 5);
			}
		}
	}

	get breakCondition() {
		return `
        || ${this.isVehicle} && game.settings.get('healthEstimate', 'core.hideVehicleHP')
		|| token.actor.type === "container"`;
	}
}
