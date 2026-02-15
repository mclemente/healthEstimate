import EstimationProvider from "./templates/Base.js";

export default class splittermondEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.breakOnZeroMaxHP = true;
		this._breakAttribute = "token.actor.system.health.max";

		// Splittermond Gesundheitsstufen (GRW p.172)
		// nbrLevels is modified by NPC features: Schwächlich (3) and Zerbrechlich (1)
		this.customLogic = "const _nbrLevels = system.health?.woundMalus?.levels?.length ?? 5;";

		this.estimations = [
			// Default: 5 Gesundheitsstufen (standard)
			// Boundaries at 80/60/40/20% of max HP
			{
				name: "",
				rule: "",
				ignoreColor: false,
				estimates: [
					{ value: 0, label: "Todgeweiht" },
					{ value: 19, label: "Todgeweiht" },
					{ value: 39, label: "Schwer verletzt" },
					{ value: 59, label: "Verletzt" },
					{ value: 79, label: "Angeschlagen" },
					{ value: 100, label: "Unverletzt" },
				],
			},
			// Schwächlich: 3 Gesundheitsstufen
			// Boundaries at 2/3 and 1/3 of max HP (trunc to 66% and 33%)
			{
				name: "Schwächlich (3 Gesundheitsstufen)",
				rule: "_nbrLevels === 3",
				ignoreColor: false,
				estimates: [
					{ value: 0, label: "Todgeweiht" },
					{ value: 32, label: "Todgeweiht" },
					{ value: 65, label: "Verletzt" },
					{ value: 100, label: "Unverletzt" },
				],
			},
			// Zerbrechlich: 1 Gesundheitsstufe (no wound penalties)
			{
				name: "Zerbrechlich (1 Gesundheitsstufe)",
				rule: "_nbrLevels === 1",
				ignoreColor: false,
				estimates: [
					{ value: 0, label: "Todgeweiht" },
					{ value: 50, label: "Angeschlagen" },
					{ value: 100, label: "Unverletzt" },
				],
			},
		];
	}

	fraction(token) {
		const hp = token.actor.system.health;
		return hp.total.value / hp.max;
	}
}
