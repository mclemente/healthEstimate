import EstimationProvider from "./templates/Base.js";

export default class ageSystemEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.breakOnZeroMaxHP = true;
	}

	_breakAttribute = "token.actor.system.health";

	fraction(token) {
		const hp = token.actor.system.health;
		return hp.value / hp.max;
	}
}
