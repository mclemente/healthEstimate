import EstimationProvider from "./templates/Base.js";

export default class ryuutamaEstimationProvider extends EstimationProvider {
	fraction(token) {
		const hp = token.actor.system.hp;
		return hp.value / hp.max;
	}
}
