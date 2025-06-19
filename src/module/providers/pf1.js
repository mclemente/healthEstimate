import { f, sGet, t } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class pf1EstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.addTemp = true;
		this.breakOnZeroMaxHP = true;
		this.customLogic = `
		const hp = token.actor.system.attributes.hp;
		let addTemp = 0;
		if (game.settings.get("healthEstimate", "core.addTemp")) {
			addTemp = hp.temp;
		}
		const totalHp = hp.value + addTemp;`;
		this.estimations = [
			...this.estimations,
			{
				name: game.i18n.localize("PF1.CondStaggered"),
				ignoreColor: true,
				rule: `
					game.settings.get("healthEstimate", "PF1.showExtra") &&
					(totalHp === 0 ||
						(hp.nonlethal > 0 && totalHp == hp.nonlethal) ||
						Array.from(token.actor.effects.values()).some((x) => x.label === game.i18n.localize("PF1.CondStaggered")))`,
				estimates: [{ value: 100, label: game.i18n.localize("PF1.CondStaggered") }],
			},
			{
				name: t("PF1.dyingName.name"),
				ignoreColor: true,
				rule: "game.settings.get(\"healthEstimate\", \"PF1.showExtra\") && hp.nonlethal > totalHp",
				estimates: [{ value: 100, label: t("PF1.dyingName.default") }],
			},
		];
	}

	fraction(token) {
		const { variants } = game.settings.get("pf1", "healthConfig");
		const hp = token.actor.system.attributes.hp;
		let addTemp = 0;
		let addNonlethal = 0;

		if ((token.actor.type === "character" && variants.pc.useWoundsAndVigor)
			|| (token.actor.type === "npc" && variants.npc.useWoundsAndVigor)) {
			const vigor = token.actor.system.attributes.vigor;
			const wounds = token.actor.system.attributes.wounds;
			if (sGet("core.addTemp")) {
				addTemp = vigor.temp;
			}
			return (vigor.value + wounds.value + addTemp) / (vigor.max + wounds.max);
		}
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
}
