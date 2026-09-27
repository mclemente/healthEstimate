import EstimationProvider from "./templates/Base.js";

export default class lancerEstimationProvider extends EstimationProvider {
	breakOnZeroMaxHP = "zero";

	fraction(token) {
		const hp = token.actor.system.hp;
		return hp.value / hp.max;
	}

	breakAttribute(token) {
		return token.actor.system?.hp?.max;
	}
}
