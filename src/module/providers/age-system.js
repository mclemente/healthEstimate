import EstimationProvider from "./templates/Base.js";

export default class ageSystemEstimationProvider extends EstimationProvider {
	breakOnZeroMaxHP = "zero";

	breakAttribute(token) {
		return token.actor.system.health;
	}

	fraction(token) {
		const hp = token.actor.system.health;
		return hp.value / hp.max;
	}
}
