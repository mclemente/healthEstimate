import EstimationProvider from "./templates/Base.js";

export default class lancerEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.breakOnZeroMaxHP = true;
	}

	fraction(token) {
		const hp = token.actor.system.derived.hp;
		return hp.value / hp.max;
	}

	get breakCondition() {
		return `
        || game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP')
        && (token.actor.system.mech?.hp.max === 0 || token.actor.system?.derived?.hp?.max === 0)`;
	}
}
