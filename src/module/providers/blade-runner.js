import EstimationProvider from "./templates/Base.js";

export default class bladeRunnerEstimationProvider extends EstimationProvider {
	fraction(token) {
		const hp = token.actor.system.health;
		return hp.value / hp.max;
	}
}
