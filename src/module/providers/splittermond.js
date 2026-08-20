import EstimationProvider from "./templates/Base.js";

export default class splittermondEstimationProvider extends EstimationProvider {
	#labels = {
		notinjured: game.i18n.localize("splittermond.woundMalusLevels.notinjured"),
		battered: game.i18n.localize("splittermond.woundMalusLevels.battered"),
		injured: game.i18n.localize("splittermond.woundMalusLevels.injured"),
		badlyinjured: game.i18n.localize("splittermond.woundMalusLevels.badlyinjured"),
		doomed: game.i18n.localize("splittermond.woundMalusLevels.doomed"),
	};

	breakOnZeroMaxHP = "zero";

	customLogic = "const _nbrLevels = system.health?.woundMalus?.levels?.length ?? 5;";

	estimations = [
		// Default: 5 Gesundheitsstufen (standard)
		// Boundaries at 80/60/40/20% of max HP
		{
			name: "",
			rule: "",
			ignoreColor: false,
			estimates: [
				{ value: 0, label: this.#labels.doomed },
				{ value: 19, label: this.#labels.doomed },
				{ value: 39, label: this.#labels.badlyinjured },
				{ value: 59, label: this.#labels.injured },
				{ value: 79, label: this.#labels.battered },
				{ value: 100, label: this.#labels.notinjured },
			],
		},

		// Schwächlich: 3 Gesundheitsstufen
		// Boundaries at 2/3 and 1/3 of max HP (trunc to 66% and 33%)
		{
			name: "Schwächlich (3 Gesundheitsstufen)",
			rule: "_nbrLevels === 3",
			ignoreColor: false,
			estimates: [
				{ value: 0, label: this.#labels.doomed },
				{ value: 32, label: this.#labels.doomed },
				{ value: 65, label: this.#labels.injured },
				{ value: 100, label: this.#labels.notinjured },
			],
		},

		// Zerbrechlich: 1 Gesundheitsstufe (no wound penalties)
		{
			name: "Zerbrechlich (1 Gesundheitsstufe)",
			rule: "_nbrLevels === 1",
			ignoreColor: false,
			estimates: [
				{ value: 0, label: this.#labels.doomed },
				{ value: 50, label: this.#labels.battered },
				{ value: 100, label: this.#labels.notinjured },
			],
		},
	];

	fraction(token) {
		const hp = token.actor.system.health;
		return hp.total.value / hp.max;
	}

	breakAttribute(token) {
		return token.actor.system.health.max;
	}
}
