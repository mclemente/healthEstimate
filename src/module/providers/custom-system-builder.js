import { getNestedData } from "../TokenTooltipAlt.js";
import { f, sGet, t } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class CustomSystemBuilderEstimationProvider extends EstimationProvider {
	fraction(token) {
		const hpPath = sGet("core.custom.FractionHP");
		const hp = getNestedData(token, hpPath) || token.actor.system.attributes?.hp || token.actor.system.hp;
		const thpPath = sGet("custom-system-builder.tempHP");
		const temp = thpPath && token.actor.type === "character" ? Number(getNestedData(token, thpPath).temp) : 0;

		this._checkValidHP(token, hp, hpPath);
		const FractionMath = sGet("core.custom.FractionMath");
		switch (FractionMath) {
			case 0:
				return Math.min((Number(hp.value) + temp) / Number(hp.max), 1);
			case 1:
			default:
				return (Number(hp.max) + temp - Number(hp.value)) / (Number(hp.max) + temp);
		}
	}

	get settings() {
		return {
			"core.custom.FractionHP": {
				hint: f("custom-system-builder.FractionHP.hint", {
					dataPath1: '"actor.system.attributeBar.hp"',
					dataPath2: '"actor.system.attributeBar.health"',
				}),
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
		};
	}
}
