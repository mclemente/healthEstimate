import EstimationProvider from "./templates/Base.js";

export default class CustomSystemBuilderEstimationProvider extends EstimationProvider {
	fraction(token) {
		const hpPath = game.settings.get("healthEstimate", "core.custom.FractionHP");
		const hp =
			foundry.utils.getProperty(token, hpPath) || token.actor.system.attributes?.hp || token.actor.system.hp;
		const thpPath = game.settings.get("healthEstimate", "custom-system-builder.tempHP");
		const temp = thpPath && token.actor.type === "character" ? Number(foundry.utils.getProperty(token, thpPath).temp) : 0;

		this._checkValidHP(token, hp, hpPath);
		const FractionMath = game.settings.get("healthEstimate", "core.custom.FractionMath");
		switch (FractionMath) {
			case 0:
				return Math.min((Number(hp.value) + temp) / Number(hp.max), 1);
			case 1:
			default:
				return (Number(hp.max) + temp - Number(hp.value)) / (Number(hp.max) + temp);
		}
	}

	get settings() {
		return {
			"core.custom.FractionHP": {
				hint: _loc("healthEstimate.custom-system-builder.FractionHP.hint", {
					dataPath1: '"actor.system.attributeBar.hp"',
					dataPath2: '"actor.system.attributeBar.health"',
				}),
				type: String,
				default: "",
			},
			"custom-system-builder.tempHP": {
				hint: _loc("healthEstimate.custom-system-builder.tempHP.hint", { setting: _loc("healthEstimate.core.custom.FractionHP.name") }),
				type: String,
				default: "",
			},
			"core.custom.FractionMath": {
				type: Number,
				default: 0,
				choices: {
					0: _loc("healthEstimate.core.custom.FractionMath.choices.0"),
					1: _loc("healthEstimate.core.custom.FractionMath.choices.1"),
				},
			},
		};
	}
}
