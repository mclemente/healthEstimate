import EstimationProvider from "./templates/Base.js";

export default class lancerEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.breakOnZeroMaxHP = true;
	}

	_breakAttribute = "token.actor.system?.hp?.max";

	fraction(token) {
		const hp = token.actor.system.hp;
		return hp.value / hp.max;
	}
}
