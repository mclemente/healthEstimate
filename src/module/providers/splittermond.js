import EstimationProvider from "./templates/Base.js";

function l(key) {
	return game.i18n.localize(`splittermond.woundMalusLevels.${key}`);
}

export default class splittermondEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.breakOnZeroMaxHP = true;

		const notinjured = l("notinjured");
		const battered = l("battered");
		const injured = l("injured");
		const badlyinjured = l("badlyinjured");
		const doomed = l("doomed");

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
					{ value: 0, label: doomed },
					{ value: 19, label: doomed },
					{ value: 39, label: badlyinjured },
					{ value: 59, label: injured },
					{ value: 79, label: battered },
					{ value: 100, label: notinjured },
				],
			},
			// Schwächlich: 3 Gesundheitsstufen
			// Boundaries at 2/3 and 1/3 of max HP (trunc to 66% and 33%)
			{
				name: "Schwächlich (3 Gesundheitsstufen)",
				rule: "_nbrLevels === 3",
				ignoreColor: false,
				estimates: [
					{ value: 0, label: doomed },
					{ value: 32, label: doomed },
					{ value: 65, label: injured },
					{ value: 100, label: notinjured },
				],
			},
			// Zerbrechlich: 1 Gesundheitsstufe (no wound penalties)
			{
				name: "Zerbrechlich (1 Gesundheitsstufe)",
				rule: "_nbrLevels === 1",
				ignoreColor: false,
				estimates: [
					{ value: 0, label: doomed },
					{ value: 50, label: battered },
					{ value: 100, label: notinjured },
				],
			},
		];
	}

	_breakAttribute = "token.actor.system.health.max";

	fraction(token) {
		const hp = token.actor.system.health;
		return hp.total.value / hp.max;
	}
}
