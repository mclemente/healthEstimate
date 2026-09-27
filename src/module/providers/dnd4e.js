import { sGet } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class dnd4eEstimationProvider extends EstimationProvider {
	addTemp = true;

	breakOnZeroMaxHP = "zero";

	organicTypes = ["Player Character", "NPC"];

	fraction(token) {
		const hp = token.actor.system.attributes.hp;
		const temphp = token.actor.system.attributes.temphp;
		let temp = 0;
		if (sGet("core.addTemp")) {
			temp = temphp.value;
		}
		return Math.min((temp + hp.value) / hp.max, 1);
	}
}
