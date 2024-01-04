import { sGet } from "../../utils.js";
import EstimationProvider from "./Base.js";

export default class a5eEstimationProvider extends EstimationProvider {
	/*
		Thanks to the original author of the 5E provider for basically providing the code needed to add A5E support.
		Thanks to Nekro and Phil for using the same datapaths in A5E as what is used in 5E, making changes basically unnessary.
	*/

	fraction(token) {
		const hp = token.actor.system.attributes.hp;
		let temp = 0;
		if (sGet("core.addTemp")) {
			temp = hp.temp;
		}
		return Math.min((temp + hp.value) / hp.max, 1);
	}
}
