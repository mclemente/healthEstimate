import EstimationProvider from "./templates/Base.js";

export default class forbiddenLandsEstimationProvider extends EstimationProvider {
	breakOnZeroMaxHP = "zero";

	filteredTypes = ["party", "stronghold"];

	fraction(token) {
		switch (token.actor.type) {
			case "character":
			case "monster": {
				const hp = token.actor.system.attribute.strength;
				return Math.min(hp.value / hp.max, 1);
			}
			default:

		}
	}

	breakAttribute(token) {
		return token.actor.system.attribute.strength.max;
	}
}
