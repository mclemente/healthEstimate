import EstimationProvider from "./templates/Base.js";

export default class symbaroumEstimationProvider extends EstimationProvider {
	fraction(token) {
		const hp = token.actor.system.health.toughness;
		return hp.value / hp.max;
	}
}
