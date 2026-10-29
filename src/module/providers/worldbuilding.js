import EstimationProvider from "./templates/Base.js";

export default class worldbuildingEstimationProvider extends EstimationProvider {
	fraction(token) {
		/* Can't think of a different way to do it that doesn't involve FS manipulation, which is its own can of worms */
		const setting = game.settings.get("healthEstimate", "worldbuilding.simpleRule");
		// eslint-disable-next-line no-new-func
		return new foundry.utils.AsyncFunction("token", setting)(token);
	}

	get settings() {
		return {
			"worldbuilding.simpleRule": {
				type: new foundry.data.fields.JavaScriptField({
					async: true,
					initial: "const hp = token.actor.system.health; return hp.value / hp.max"
				}),
			},
		};
	}
}
