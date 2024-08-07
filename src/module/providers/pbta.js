import { sGet } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class pbtaEstimationProvider extends EstimationProvider {
	fraction(token) {
		const hpPath = sGet("core.custom.FractionHP");
		const hp = foundry.utils.getProperty(token, hpPath);
		this._checkValidHP(token, hp, hpPath);
		if (hp.type === "Resource") return hp.value / hp.max;
		return (hp.max - hp.value) / hp.max;
	}

	get settings() {
		return {
			"core.custom.FractionHP": {
				type: String,
				default: ""
			},
		};
	}
}
