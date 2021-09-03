import { sGet, t } from "../utils.js";

const fraction = function (token) {
	const hp = token.actor.data.data.attributes?.hp || token.actor.data.data.hp;
	let temp = 0;
	if (
		game.settings.get("healthEstimate", "core.addTemp") &&
		token.actor.data.type === "character"
	) {
		temp = hp.temp;
	}
	const outputs = [
		Math.min((hp.value + temp) / hp.max, 1),
		(hp.max - hp.value) / hp.max,
	];
	return outputs[sGet("core.custom.FractionMath")];
};
const settings = () => {
	return {
		// 'core.custom.FractionHP' : {
		// 	type: String,
		// 	default: ""
		// },
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
