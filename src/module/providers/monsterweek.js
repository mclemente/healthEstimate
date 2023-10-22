import EstimationProvider from "./templates/Base.js";

export default class monsterweekEstimationProvider extends EstimationProvider {
	fraction(token) {
		const hp = token.actor.system.harm;
		return hp.value / hp.max;
	}

	get breakCondition() {
		return "||token.actor.type === \"location\"";
	}
}
