import EstimationProvider from "./templates/Base.js";

export default class lancerEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.breakOnZeroMaxHP = true;
	}

	fraction(token) {
		const hp = token.actor.system.hp;
		return hp.value / hp.max;
	}

	get breakCondition() {
		return `
        || game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP')
        && (token.actor.system?.hp?.max === 0)`;
	}
}
