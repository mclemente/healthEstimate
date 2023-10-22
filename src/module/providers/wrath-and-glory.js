import { sGet } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class wrathAndGloryEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.addTemp = true;
		this.breakOnZeroMaxHP = true;
		this.organicTypes = ["agent", "threat"];
	}

	fraction(token) {
		const hp = token.actor.system.combat.wounds;
		let temp = 0;
		if (sGet("core.addTemp")) temp = Number(hp.bonus);
		return (Number(hp.max) + temp - Number(hp.value)) / (Number(hp.max) + temp);
	}

	get breakCondition() {
		return "|| (game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.combat.wounds.max === 0)";
	}
}
