import { sGet, t } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class swadeEstimationProvider extends EstimationProvider {
	deathStateName = game.i18n.localize("SWADE.Incap");

	estimations = [
		{
			estimates: [
				{ value: 0, label: game.i18n.localize("SWADE.Incap") },
				{ value: 25, label: t("core.estimates.states.1") },
				{ value: 50, label: t("core.estimates.states.2") },
				{ value: 99, label: t("core.estimates.states.3") },
				{ value: 100, label: t("core.estimates.states.5") },
			],
		},
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

	vehicleConfig = true;

	fraction(token) {
		const hp = token.actor.system.wounds;
		let maxHP = Math.max(hp.max, 1);
		if (hp.max || token.actor.system.wildcard) {
			const defaultWildCardMaxWounds = sGet("swade.defaultWildCardMaxWounds");
			maxHP = 1 + (hp.max || defaultWildCardMaxWounds);
		}
		return (maxHP - hp.value) / maxHP;
	}

	get settings() {
		return {
			"swade.defaultWildCardMaxWounds": {
				type: Number,
				default: 3,
				range: {
					min: 1,
					max: 10,
				},
			},
		};
	}

	tokenEffects(token) {
		return !!token.actor.effects.find((e) => e.img === CONFIG.statusEffects.incapacitated.img);
	}
}
