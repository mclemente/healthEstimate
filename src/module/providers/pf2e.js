import { sGet, t } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class pf2eEstimationProvider extends EstimationProvider {
	addTemp = true;

	breakOnZeroMaxHP = "zero";

	estimations = [
		...this.estimations,
		{
			name: "Vehicles & Hazards",
			estimates: [
				{ value: 0, label: t("core.estimates.vehicles.0") },
				{ value: 20, label: t("core.estimates.vehicles.1") },
				{ value: 40, label: t("core.estimates.vehicles.2") },
				{ value: 60, label: t("core.estimates.vehicles.3") },
				{ value: 80, label: t("core.estimates.vehicles.4") },
				{ value: 100, label: t("core.estimates.vehicles.5") },
			],
			actorTypes: ["vehicle", "hazard"]
		},
	];

	fraction(token) {
		const data = foundry.utils.deepClone(token.actor.system.attributes);
		const hp = data.hp;
		if (token.actor.type === "familiar" && token.actor.system?.master) {
			const master = token.actor.system.master;
			hp.max = token.actor.hitPoints.max ?? 5 * game.actors.get(master.id).system.details.level.value;
		}
		let temp = sGet("core.addTemp") && hp.temp ? hp.temp : 0;
		let sp = game.settings.get("pf2e", "staminaVariant") && sGet("PF2E.staminaToHp") && hp.sp
			? hp.sp
			: { value: 0, max: 0 };
		return Math.min((hp.value + sp.value + temp) / (hp.max + sp.max), 1);
	}

	refreshToken(token, flags) {
		const top = game.healthEstimate.position === "a";
		const { distanceDisplay } = game.pf2e.settings;
		const hasEstimate = !!token.healthEstimate && !token.healthEstimate?.destroyed;
		if (top && distanceDisplay && hasEstimate && flags.refreshDistanceLabel) {
			const labelEl = document.getElementById("token-hover-distance");
			let y = parseFloat(labelEl.style.getPropertyValue("--position-y"));
			y -= token.healthEstimate.height;
			labelEl.style.setProperty("--position-y", `${y}px`);
		}
	}

	get settings() {
		return {
			"PF2E.staminaToHp": {
				type: Boolean,
				default: true,
			},
			"PF2E.hideHazardHP": {
				type: Boolean,
				default: true,
			},
			"PF2E.hideVehicleHP": {
				type: Boolean,
				default: false,
			}
		};
	}

	get breakCondition() {
		return `
        || token.actor.type === 'vehicle' && game.settings.get('healthEstimate', 'PF2E.hideVehicleHP')
        || token.actor.type === 'hazard' && game.settings.get('healthEstimate', 'PF2E.hideHazardHP')
        || token.actor.type === 'loot'
        || token.actor.type === 'party'
        ${super.breakCondition}`;
	}
}
