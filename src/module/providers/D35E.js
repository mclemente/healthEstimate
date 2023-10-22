import { f, sGet, t } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class D35EEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.customLogic = `
		const hp = token.actor.system.attributes.hp;
		let addTemp = 0;
		if (game.settings.get("healthEstimate", "core.addTemp")) {
			addTemp = hp.temp;
		}
		const totalHp = hp.value + addTemp;`;
		this.addTemp = true;
		this.breakOnZeroMaxHP = true;
		this.estimations = [
			...this.estimations,
			{
				name: game.i18n.localize("D35E.CondStaggered"),
				ignoreColor: true,
				rule: `
					game.settings.get("healthEstimate", "PF1.showExtra") &&
					(totalHp === 0 ||
						(hp.nonlethal > 0 && totalHp == hp.nonlethal) ||
						Array.from(token.actor.effects.values()).some((x) => x.label === game.i18n.localize("D35E.CondStaggered")))`,
				estimates: [{ value: 100, label: game.i18n.localize("D35E.CondStaggered") }],
			},
			{
				name: t("PF1.dyingName.name"),
				ignoreColor: true,
				rule: "game.settings.get(\"healthEstimate\", \"PF1.showExtra\") && hp.nonlethal > totalHp",
				estimates: [{ value: 100, label: t("core.estimates.states.0") }],
			},
		];
	}

	fraction(token) {
		const hp = token.actor.system.attributes.hp;
		let addTemp = 0;
		let addNonlethal = 0;
		if (sGet("core.addTemp")) {
			addTemp = hp.temp;
		}
		if (sGet("PF1.addNonlethal")) {
			addNonlethal = hp.nonlethal;
		}
		return (hp.value - addNonlethal + addTemp) / hp.max;
	}

	get settings() {
		return {
			"PF1.addNonlethal": {
				type: Boolean,
				default: true,
			},
			"PF1.showExtra": {
				name: f("PF1.showExtra.name", {
					condition1: t("PF1.disabledName.default"),
					condition2: t("PF1.dyingName.default"),
				}),
				hint: f("PF1.showExtra.hint", {
					condition1: t("PF1.disabledName.default"),
					condition2: t("PF1.dyingName.default"),
				}),
				type: Boolean,
				default: true,
			},
			"PF1.disabledName": {
				type: String,
				default: t("PF1.disabledName.default"),
				config: false,
			},
			"PF1.dyingName": {
				type: String,
				default: t("PF1.dyingName.default"),
				config: false,
			},
		};
	}

	get breakCondition() {
		return "||game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.attributes.hp.max === 0";
	}
}
