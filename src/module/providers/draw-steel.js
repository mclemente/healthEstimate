import EstimationProvider from "./templates/Base.js";

export default class drawsteelEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.organicTypes = ["hero", "npc"];
		this.breakOnZeroMaxHP = true;
		this.estimations = [
			{
				name: "unconscious",
				ignoreColor: true,
				rule: "effects.values().some((x) => x.name === 'Unconscious' || x.name === 'Asleep');",
				estimates: [{ value: 100, label: "Unconscious" }],
			},
			{
				name: "Heroes",
				rule: "token.actor.type === 'hero'",
				estimates: [
					{ value: 0, label: "Dead" },
					{ value: 33, label: "Dying" },
					{ value: 66, label: "Winded" },
					{ value: 99, label: "Injured" },
					{ value: 100, label: "Unharmed" },
				],
			},
			{
				name: "NPCs",
				rule: "token.actor.type === 'npc'",
				estimates: [
					{ value: 0, label: "Dead" },
					{ value: 25, label: "Near Death" },
					{ value: 50, label: "Winded" },
					{ value: 99, label: "Injured" },
					{ value: 100, label: "Unharmed" },
				],
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
