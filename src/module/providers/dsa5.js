import EstimationProvider from "./templates/Base.js";

export default class dsa5EstimationProvider extends EstimationProvider {
	fraction(token) {
		let hp = token.actor.system.status.wounds;
		return hp.value / hp.max;
	}
}
