import { getNestedData, sGet, t } from "../utils.js";

const fraction = function (token) {
	const hpPath = sGet("core.custom.FractionHP");
	let hp = getNestedData(token, hpPath) || token.actor.system.attributes?.hp || token.actor.system.hp;
	let temp = 0;
	if (game.settings.get("healthEstimate", "core.addTemp") && token.actor.type === "character") {
		temp = hp.temp;
	}
	if (hp === undefined && hpPath === "") throw new Error(`The HP is undefined, try using the ${game.i18n.localize("healthEstimate.core.custom.FractionHP.name")} setting.`);
	else if (hp === undefined) throw new Error(`The ${game.i18n.localize("healthEstimate.core.custom.FractionHP.name")} setting ("${hpPath}") is wrong.`);
	const outputs = [Math.min((hp.value + temp) / hp.max, 1), (hp.max - hp.value) / hp.max];
	return outputs[sGet("core.custom.FractionMath")];
};
const settings = () => {
	return {
		"core.custom.FractionHP": {
			type: String,
			default: "",
		},
		"core.custom.FractionMath": {
			type: Number,
			default: 0,
			choices: {
				0: t("core.custom.FractionMath.choices.0"),
				1: t("core.custom.FractionMath.choices.1"),
			},
		},
		"core.addTemp": {
			type: Boolean,
			default: false,
		},
		"core.breakOnZeroMaxHP": {
			type: Boolean,
			default: true,
		},
	};
};

export { fraction, settings };
