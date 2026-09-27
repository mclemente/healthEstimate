import EstimationProvider from "./templates/Base.js";

export default class crucibleEstimationProvider extends EstimationProvider {
	breakOnZeroMaxHP = "zero";

	estimations = [
		...this.estimations,
		{
			// Same idea for Broken (Morale at 0), unless the Actor is already Insane.
			name: game.i18n.localize("ACTIVE_EFFECT.STATUSES.Broken"),
			ignoreColor: true,
			estimates: [{ value: 100, label: game.i18n.localize("ACTIVE_EFFECT.STATUSES.Broken") }],
			statusEffects: ["broken"]
		},
		{
			// Overrides the label (but not the color) whenever the Actor has gone Insane, since Madness
			// filling up is just as incapacitating as Health/Wounds running out, but uses a separate pool.
			name: game.i18n.localize("ACTIVE_EFFECT.STATUSES.Insane"),
			ignoreColor: true,
			estimates: [{ value: 100, label: game.i18n.localize("ACTIVE_EFFECT.STATUSES.Insane") }],
			statusEffects: ["insane"]
		}
	];

	filteredTypes = ["group"];

	// Only Heroes and Adversaries track Health/Wounds & Morale/Madness. Group actors have no resources at all.
	organicTypes = ["hero", "adversary"];

	breakAttribute(token) {
		return token.actor.system.resources.health.max;
	}

	/**
	 * Combines Health and Wounds into a single smooth fraction. Health depletes first, then further damage
	 * is tracked as Wounds filling up towards Health.max + Wounds.max, at which point the Actor dies.
	 * Actors that don't track reserve resources (e.g. most Adversaries) just use plain Health.
	 */
	fraction(token) {
		const { resources, usesReserveResources } = token.actor.system;
		const { health, wounds } = resources;
		if (usesReserveResources && wounds?.max) {
			return (health.value + (wounds.max - wounds.value)) / (health.max + wounds.max);
		}
		return health.max ? health.value / health.max : 1;
	}
}
