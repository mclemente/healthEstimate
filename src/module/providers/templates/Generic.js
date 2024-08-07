import { sGet, t } from "../../utils.js";
import EstimationProvider from "./Base.js";

export default class GenericEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.addTemp = true;
	}

	fraction(token) {
		const hpPath = sGet("core.custom.FractionHP");
		let hp;
		if (hpPath) {
			hp = foundry.utils.getProperty(token, hpPath);
		} else {
			const primaryTokenAttribute = game.system.primaryTokenAttribute;

			hp = primaryTokenAttribute
				? foundry.utils.getProperty(token, `actor.system.${primaryTokenAttribute}`)
				: token.actor.system?.attributes?.hp || token.actor.system?.hp;
		}
		let temp = 0;
		if (sGet("core.addTemp")) temp = Number(hp?.temp) || 0;

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
