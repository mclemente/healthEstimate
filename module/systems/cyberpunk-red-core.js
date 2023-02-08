import { t } from "../utils.js";

/**
 * This function only exists to not break the algorithm.
 * This system has its own Estimate, called Wound State, which is calculated by the system.
 * So, instead of having two different estimates, it uses CPR's.
 **/
const fraction = function (token) {
	const hp = token.actor.system.derivedStats.hp;
	return hp.value / hp.max;
};

const breakCondition = `||token.actor.type === "blackIce" || token.actor.type === "container" || token.actor.type === "demon"`;

let descriptions = function (descriptions, stage, token, state = { dead: false, desc: "" }, fraction) {
	if (state.dead) {
		return state.desc;
	}
	if (game.settings.get("healthEstimate", "cyberpunk-red-core.useSystemStates")) {
		return game.i18n.localize(`CPR.global.woundState.${token.actor.system.derivedStats.currentWoundState}`);
	}
	return descriptions[stage];
};

const settings = () => {
	return {
		"cyberpunk-red-core.useSystemStates": {
			type: Boolean,
			default: true,
			hint: t("cyberpunk-red-core.useSystemStates.hint"),
		},
	};
};

// export { fraction, breakCondition, descriptions, settings };
export { fraction, breakCondition };
