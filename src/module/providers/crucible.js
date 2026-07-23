import EstimationProvider from "./templates/Base.js";

/**
 * Computes the fraction remaining for a Crucible resource pool, taking its paired
 * reserve pool (Wounds for Health, Madness for Morale) into account when relevant.
 * @param {{value: Number, max: Number}} active               The active pool (Health or Morale).
 * @param {{value: Number, max: Number}} reserve               The paired reserve pool (Wounds or Madness).
 * @param {Boolean} usesReserveResources    Whether this Actor tracks Wounds & Madness at all.
 * @returns {Number}
 */
function poolFraction(active, reserve, usesReserveResources) {
	if (usesReserveResources && reserve?.max) {
		return (active.value + (reserve.max - reserve.value)) / (active.max + reserve.max);
	}
	return active.max ? active.value / active.max : 1;
}

export default class crucibleEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		// Only Heroes and Adversaries track Health/Wounds & Morale/Madness. Group actors have no resources at all.
		this.organicTypes = ["hero", "adversary"];
		this.breakOnZeroMaxHP = "zero";

		this.estimations = [
			...this.estimations,
			{
				// Overrides the label (but not the color) whenever the Actor has gone Insane, since Madness
				// filling up is just as incapacitating as Health/Wounds running out, but uses a separate pool.
				name: game.i18n.localize("ACTIVE_EFFECT.STATUSES.Insane"),
				ignoreColor: true,
				rule: "system.isInsane",
				estimates: [{ value: 100, label: game.i18n.localize("ACTIVE_EFFECT.STATUSES.Insane") }],
			},
			{
				// Same idea for Broken (Morale at 0), unless the Actor is already Insane.
				name: game.i18n.localize("ACTIVE_EFFECT.STATUSES.Broken"),
				ignoreColor: true,
				rule: "system.isBroken && !system.isInsane",
				estimates: [{ value: 100, label: game.i18n.localize("ACTIVE_EFFECT.STATUSES.Broken") }],
			},
		];
	}

	_breakAttribute = "token.actor.system.resources.health.max";

	/**
	 * Combines Health and Wounds into a single smooth fraction. Health depletes first, then further damage
	 * is tracked as Wounds filling up towards Health.max + Wounds.max, at which point the Actor dies.
	 * Actors that don't track reserve resources (e.g. most Adversaries) just use plain Health.
	 */
	fraction(token) {
		const { resources, usesReserveResources } = token.actor.system;
		return poolFraction(resources.health, resources.wounds, usesReserveResources);
	}

	get breakCondition() {
		return `
		|| token.actor.type === "group"
		${super.breakCondition}`;
	}
}
