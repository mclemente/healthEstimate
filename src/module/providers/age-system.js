import EstimationProvider from "./templates/Base.js";

export default class ageSystemEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.breakOnZeroMaxHP = true;
	}

	fraction(token) {
		const hp = token.actor.system.health;
		return hp.value / hp.max;
	}

	get breakCondition() {
		return "|| (game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.health.max === 0)";
	}
}
