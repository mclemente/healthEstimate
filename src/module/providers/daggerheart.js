import EstimationProvider from "./templates/Base.js";

// The object retrieved during actor.getRollData for a 'DhCharacter' has a 'class' property
// so the provider isn't able to construct the method using "new Function" because that's a forbidden property
// Character will fallback to the "Default" implementation which works fine, but doesn't support condition specific estimation
// if they update the system at one point in the future then this will start working fine as we don't use that property
// Adversary and Companion work fine because they don't have the class property
// There's also a spelling mistake in the system for 'Unconscious' so I've covered both cases
export default class daggerheartEstimationProvider extends EstimationProvider {

	constructor() {
		super();
		this.organicTypes = ["character", "adversary", "companion"];
		this.breakOnZeroMaxHP = true;
		this.estimations = [
			...this.estimations,
			{
				name: "unconscious",
				rule: "effects.values().some((x) => x.name === 'Unconscious') || effects.values().some((x) => x.name === 'Unconcious');",
				estimates: [{ value: 100, label: "Unconscious" }],
			},
			{
				name: "dead",
				ignoreColor: true,
				rule: "effects.values().some((x) => x.name === 'Dead');",
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

	// ;

	fraction(token) {
		let resource = token.actor.type === "adversary" || token.actor.type === "character"
			? token.actor.system.resources.hitPoints  // health for adversary and player
			: token.actor.system.resources.stress;    // stress for companion

		return resource.isReversed
			? (resource.max - resource.value) / resource.max
			: resource.value / resource.max;
	}
}
