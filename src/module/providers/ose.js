import EstimationProvider from "./templates/Base.js";

export default class oseEstimationProvider extends EstimationProvider {
	fraction(token) {
		const hp = token.actor.system.hp;
		return Math.min(hp.value / hp.max, 1);
	}
}
