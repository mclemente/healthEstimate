import EstimationProvider from "./templates/Base.js";

export default class swnrEstimationProvider extends EstimationProvider {
	fraction(token) {
		const hp = token.actor.system.health;
		return Math.min(hp.value / hp.max, 1);
	}
}
