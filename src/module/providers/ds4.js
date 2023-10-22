import EstimationProvider from "./templates/Base.js";

export default class ds4EstimationProvider extends EstimationProvider {
	fraction(token) {
		let hp = token.actor.system.combatValues.hitPoints;
		return hp.value / hp.max;
	}
}
