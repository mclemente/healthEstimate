import EstimationProvider from "./templates/Base.js";

export default class daggerheartEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.organicTypes = ["character", "adversary", "companion"];
		this.breakOnZeroMaxHP = true;
		this.estimations = [
			...this.estimations,
			{
				name: "unconscious",
				rule: "effects.values().some((ef) => ef.statuses.has('unconscious'));",
				estimates: [{ value: 100, label: game.i18n.localize("EFFECT.StatusUnconscious") }],
			},
			{
				name: "dead",
				ignoreColor: true,
				rule: `
					const { unconscious, defeated, dead } = CONFIG.DH.GENERAL.conditions;
					const defeatedConditions = new Set([unconscious.id, defeated.id, dead.id]);
					return actor?.statuses.intersection(defeatedConditions)?.size;`.trim(),
				estimates: [{ value: 100, label: "Dead" }],
			},
			{
				name: "companion",
				rule: "actor.type === 'companion';",
				estimates: [
					{ value: 0, label: "Fleeing" },
					{ value: 25, label: "Frightened" },
					{ value: 50, label: "Exhausted" },
					{ value: 99, label: "Winded" },
					{ value: 100, label: "Energetic" },
				],
			},
		];
	}

	fraction(token) {
		let resource = token.actor.type === "adversary" || token.actor.type === "character"
			? token.actor.system.resources.hitPoints  // health for adversary and player
			: token.actor.system.resources.stress;    // stress for companion

		return resource.isReversed
			? (resource.max - resource.value) / resource.max
			: resource.value / resource.max;
	}
}
