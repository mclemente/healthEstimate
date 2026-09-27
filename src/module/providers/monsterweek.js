import EstimationProvider from "./templates/Base.js";

export default class monsterweekEstimationProvider extends EstimationProvider {
	filteredTypes = ["location"];

	fraction(token) {
		const hp = token.actor.system.harm;
		return hp.value / hp.max;
	}
}
