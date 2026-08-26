import { t } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class drawsteelEstimationProvider extends EstimationProvider {
	breakOnZeroMaxHP = "zero";

	estimations = [
		{
			estimates: [
				{ value: 0, label: t("core.estimates.states.0") },
				{ value: 33, label: game.i18n.localize("DRAW_STEEL.ActiveEffect.StaminaEffects.Dying") },
				{ value: 66, label: game.i18n.localize("DRAW_STEEL.ActiveEffect.StaminaEffects.Winded") },
				{ value: 99, label: t("core.estimates.states.4") },
				{ value: 100, label: t("core.estimates.states.5") },
			],
		},
		{
			name: "NPCs",
			estimates: [
				{ value: 0, label: t("core.estimates.states.0") },
				{ value: 25, label: game.i18n.localize("DRAW_STEEL.ActiveEffect.StaminaEffects.Dying") },
				{ value: 50, label: game.i18n.localize("DRAW_STEEL.ActiveEffect.StaminaEffects.Winded") },
				{ value: 99, label: t("core.estimates.states.4") },
				{ value: 100, label: t("core.estimates.states.5") },
			],
			actorTypes: ["npc"]
		},
		{
			name: "Objects",
			estimates: [
				{ value: 0, label: t("core.estimates.vehicles.0") },
				{ value: 20, label: t("core.estimates.vehicles.1") },
				{ value: 40, label: t("core.estimates.vehicles.2") },
				{ value: 60, label: t("core.estimates.vehicles.3") },
				{ value: 80, label: t("core.estimates.vehicles.4") },
				{ value: 100, label: t("core.estimates.vehicles.5") },
			],
			actorTypes: ["object"]
		},
		{
			name: "Unconscious",
			ignoreColor: true,
			rule: "effects.values().some((ef) => ef.statuses.has('sleep'));",
			estimates: [{ value: 100, label: game.i18n.localize("EFFECT.StatusUnconscious") }],
		},
	];

	filteredTypes = ["party"];

	organicTypes = ["hero", "npc"];

	vehicleRules = {
		config: false,
		vehicles: ["object"],
	};

	fraction(token) {
		const stamina = token.actor.system.stamina;
		return (stamina.value - stamina.min) / (stamina.max - stamina.min);
	}

	get settings() {
		return {
			"draw-steel.hideObjectHP": {
				type: Boolean,
				default: true,
			}
		};
	}

	breakCondition(token) {
		return super.breakCondition(token) || this.breakAttribute(token) === null;
	}

	breakAttribute(token) {
		return token.actor.system.stamina.max;
	}
}
