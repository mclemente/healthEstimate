import { sGet } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class tormenta20EstimationProvider extends EstimationProvider {
	addTemp = true;

	breakOnZeroMaxHP = "zero";

	fraction(token) {
		const hp = token.actor.system.attributes.pv;
		let temp = 0;
		if (token.actor.type === "character" && sGet("core.addTemp")) {
			temp = hp.temp;
		}
		return Math.min((temp + hp.value) / hp.max, 1);
	}

	breakAttribute(token) {
		return token.actor.system.attributes.pv.max;
	}
}
