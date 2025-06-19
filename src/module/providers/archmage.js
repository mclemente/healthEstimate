import { sGet } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class archmageEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.addTemp = true;
		this.breakOnZeroMaxHP = true;
	}

	fraction(token) {
		const hp = token.actor.system.attributes.hp;
		let temp = 0;
		if (token.actor.type === "character" && sGet("core.addTemp")) {
			temp = hp.temp;
		}
		return Math.min((temp + hp.value) / hp.max, 1);
	}
}
