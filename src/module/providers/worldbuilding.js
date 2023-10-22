import { sGet } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class worldbuildingEstimationProvider extends EstimationProvider {
	fraction(token) {
		/* Can't think of a different way to do it that doesn't involve FS manipulation, which is its own can of worms */
		const setting = sGet("worldbuilding.simpleRule");
		// eslint-disable-next-line no-new-func
		return Function("token", setting)(token);
	}

	get settings() {
		return {
			"worldbuilding.simpleRule": {
				type: String,
				default: "const hp = token.actor.system.health; return hp.value / hp.max",
			},
		};
	}
}
