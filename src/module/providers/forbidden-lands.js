import EstimationProvider from "./templates/Base.js";

export default class forbiddenLandsEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.breakOnZeroMaxHP = true;
	}

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

	get breakCondition() {
		return `
        || token.actor.type === "party"
        || token.actor.type === "stronghold"
        || (game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.attribute.strength.max === 0)`;
	}
}
