import EstimationProvider from "./templates/Base.js";

export default class CoC7EstimationProvider extends EstimationProvider {
	filteredTypes = ["container"];

	fraction(token) {
		const hp = token.actor.system.attribs.hp;
		if (hp.max > 0) return hp.value / hp.max;
		return 0;
	}
}
