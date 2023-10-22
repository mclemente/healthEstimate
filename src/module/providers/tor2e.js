import EstimationProvider from "./templates/Base.js";

export default class tor2eEstimationProvider extends EstimationProvider {
	fraction(token) {
		switch (token.actor.type) {
			case "character": {
				const hp = token.actor.system.resources.endurance;
				return hp.value / hp.max;
			}
			case "adversary": {
				const hp = token.actor.system.endurance;
				return hp.value / hp.max;
			}
			case "npc": {
				const hp = token.actor.system.endurance;
				return hp.value / hp.max;
			}
		}
	}
}
