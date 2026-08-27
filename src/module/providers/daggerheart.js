import EstimationProvider from "./templates/Base.js";

export default class daggerheartEstimationProvider extends EstimationProvider {
	breakOnZeroMaxHP = "zero";

	estimations = [
		...this.estimations,
		{
			name: _loc("DAGGERHEART.CONFIG.Condition.unconscious.name"),
			estimates: [{ value: 100, label: game.i18n.localize("EFFECT.StatusUnconscious") }],
			statusEffect: ["unconscious"]
		},
		{
			name: _loc("DAGGERHEART.CONFIG.Condition.dead.name"),
			ignoreColor: true,
			estimates: [{ value: 100, label: "Dead" }],
			statusEffect: ["unconscious", "defeated", "dead"]
		},
		{
			name: _loc("TYPES.Actor.companion"),
			estimates: [
				{ value: 0, label: "Fleeing" },
				{ value: 25, label: "Frightened" },
				{ value: 50, label: "Exhausted" },
				{ value: 99, label: "Winded" },
				{ value: 100, label: "Energetic" },
			],
			actorTypes: ["companion"]
		},
	];

	filteredTypes = ["environment", "npc", "party"];

	organicTypes = ["character", "adversary", "companion"];

	fraction(token) {
		let resource = token.actor.type === "adversary" || token.actor.type === "character"
			? token.actor.system.resources.hitPoints  // health for adversary and player
			: token.actor.system.resources.stress;    // stress for companion

		return resource.isReversed
			? (resource.max - resource.value) / resource.max
			: resource.value / resource.max;
	}
}
