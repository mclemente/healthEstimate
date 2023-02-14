import { f, getNestedData, sGet, t } from "../utils.js";

const fraction = function (token) {
	const hpPath = sGet("core.custom.FractionHP");
	const hp = getNestedData(token, hpPath) || token.actor.system.attributes?.hp || token.actor.system.hp;
	const thpPath = sGet("core.custom.TempHP");
	const temp = thpPath && token.actor.type === "character" ? getNestedData(token, thpPath).temp : 0;

	if (hp === undefined && hpPath === "") throw new Error(`The HP is undefined, try using the ${game.i18n.localize("healthEstimate.core.custom.FractionHP.name")} setting.`);
	else if (hp === undefined) throw new Error(`The ${game.i18n.localize("healthEstimate.core.custom.FractionHP.name")} setting ("${hpPath}") is wrong.`);
	const outputs = [Math.min((hp.value + temp) / hp.max, 1), (hp.max - hp.value) / hp.max];
	return outputs[sGet("core.custom.FractionMath")];
};
const settings = () => {
	return {
		"core.custom.FractionHP": {
			hint: f("custom-system-builder.FractionHP.hint", { dataPath1: '"actor.system.props.hp"', dataPath2: '"actor.system.props.health"' }),
			type: String,
			default: "",
		},
		"custom-system-builder.tempHP": {
			hint: f("custom-system-builder.tempHP.hint", { setting: t("core.custom.FractionHP.name") }),
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
		"core.breakOnZeroMaxHP": {
			type: Boolean,
			default: true,
		},
	};
};

export { fraction, settings };
