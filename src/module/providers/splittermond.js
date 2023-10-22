import EstimationProvider from "./templates/Base.js";

export default class splittermondEstimationProvider extends EstimationProvider {
	fraction(token) {
		const hp = token.actor.system.health;
		return hp.total.value / hp.max;
	}
}
