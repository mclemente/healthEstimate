import { f, t } from "../utils.js";

const fraction = function (token) {
	const hp = token.actor.system.attributes.hp;
	let addTemp = 0;
	let addNonlethal = 0;
	if (game.settings.get("healthEstimate", "core.addTemp")) {
		addTemp = hp.temp;
	}
	if (game.settings.get("healthEstimate", "PF1.addNonlethal")) {
		addNonlethal = hp.nonlethal;
	}
	return (hp.value - addNonlethal + addTemp) / hp.max;
};
const settings = () => {
	return {
		"core.addTemp": {
			type: Boolean,
			default: false,
		},
		"core.breakOnZeroMaxHP": {
			type: Boolean,
			default: true,
		},
		"PF1.addNonlethal": {
			type: Boolean,
			default: true,
		},
		"PF1.showExtra": {
			name: f("PF1.showExtra.name", { condition1: t("PF1.disabledName.default"), condition2: t("PF1.dyingName.default") }),
			hint: f("PF1.showExtra.hint", { condition1: t("PF1.disabledName.default"), condition2: t("PF1.dyingName.default") }),
			type: Boolean,
			default: true,
		},
		"PF1.disabledName": {
			type: String,
			default: t("PF1.disabledName.default"),
		},
		"PF1.dyingName": {
			type: String,
			default: t("PF1.dyingName.default"),
		},
	};
};
const descriptions = function (descriptions, stage, token, state = { dead: false, desc: "" }) {
	if (state.dead) {
		return state.desc;
	}
	const hp = token.actor.system.attributes.hp;
	let addTemp = 0;
	if (game.settings.get("healthEstimate", "core.addTemp")) {
		addTemp = hp.temp;
	}
	const totalHp = hp.value + addTemp;
	if (game.settings.get("healthEstimate", "PF1.showExtra")) {
		if (
			totalHp === 0 ||
			(hp.nonlethal > 0 && totalHp == hp.nonlethal) ||
			Array.from(token.actor.effects.values()).some((x) => x.label === game.i18n.localize(`${game.system.id.toUpperCase()}.CondStaggered`))
		) {
			return game.settings.get("healthEstimate", "PF1.disabledName");
		} else if (hp.nonlethal > totalHp) {
			return game.settings.get("healthEstimate", "PF1.dyingName");
		}
	}
	return descriptions[stage];
};
const breakCondition = `||game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.attributes.hp.max === 0`;

export { fraction, settings, descriptions, breakCondition };
