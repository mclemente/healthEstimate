import { t } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class cyberpunkRedCoreEstimationProvider extends EstimationProvider {
	// This game has its own estimates, called Wound State, which are calculated by the system.
	// The issue is that this data is only broadcast to GMs, not other users.
	// See https://github.com/mclemente/healthEstimate/issues/119
	// and https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/issues/680
	constructor() {
		super();
		this.estimations = [
			{
				name: "",
				rule: "",
				estimates: [
					{ value: 0, label: game.i18n.localize("CPR.global.woundState.dead") },
					{ value: 1, label: game.i18n.localize("CPR.global.woundState.mortallyWounded") },
					{ value: 50, label: game.i18n.localize("CPR.global.woundState.seriouslyWounded") },
					{ value: 99, label: game.i18n.localize("CPR.global.woundState.lightlyWounded") },
					{ value: 100, label: game.i18n.localize("CPR.global.woundState.notWounded") },
				],
			},
			{
				name: `${game.i18n.localize("TYPES.Actor.Blackice")}/${game.i18n.localize("TYPES.Actor.Demon")}`,
				rule: "type === \"blackIce\" || type === \"demon\"",
				estimates: [
					{ value: 0, label: t("cyberpunk-red-core.unorganics.0") },
					{ value: 50, label: t("cyberpunk-red-core.unorganics.2") },
					{ value: 99, label: t("cyberpunk-red-core.unorganics.3") },
					{ value: 100, label: t("cyberpunk-red-core.unorganics.4") },
				],
			},
		];
	}

	fraction(token) {
		let hp;
		if (token.actor.system.derivedStats) {
			hp = token.actor.system.derivedStats.hp;
		} else if (token.actor.system.stats) {
			hp = token.actor.system.stats.rez;
		}
		return hp.value / hp.max;
	}

	get breakCondition() {
		return "|| token.actor.type === 'container'";
	}
}
