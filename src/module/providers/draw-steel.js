import { t } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class drawsteelEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.organicTypes = ["hero", "npc"];
		this.breakOnZeroMaxHP = true;
		this.estimations = [
			{
				name: "",
				rule: "",
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
				rule: "type === \"npc\"",
				estimates: [
					{ value: 0, label: t("core.estimates.states.0") },
					{ value: 25, label: game.i18n.localize("DRAW_STEEL.ActiveEffect.StaminaEffects.Dying") },
					{ value: 50, label: game.i18n.localize("DRAW_STEEL.ActiveEffect.StaminaEffects.Winded") },
					{ value: 99, label: t("core.estimates.states.4") },
					{ value: 100, label: t("core.estimates.states.5") },
				]
			},
			{
				name: "Unconscious",
				ignoreColor: true,
				rule: "effects.values().some((ef) => ef.statuses.has('sleep'));",
				estimates: [{ value: 100, label: game.i18n.localize("EFFECT.StatusUnconscious") }],
			},
		];
	}

	fraction(token) {
		const minHealth = token.actor.system.stamina.min;
		const maxHealth = token.actor.system.stamina.max;
		const currentHealth = token.actor.system.stamina.value;

		return (currentHealth - minHealth) / (maxHealth - minHealth);
	}
}
