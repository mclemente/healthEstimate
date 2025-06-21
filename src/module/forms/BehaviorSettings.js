import { HealthEstimateSettingsV2 } from "./templates/BaseV2.js";

export default class HealthEstimateBehaviorSettings extends HealthEstimateSettingsV2 {
	static DEFAULT_OPTIONS = {
		id: "health-estimate-behavior-form",
		actions: {
			reset: HealthEstimateBehaviorSettings.reset,
		},
		window: {
			icon: "fas fa-gear",
			title: "healthEstimate.core.menuSettings.behaviorSettings.plural",
		},
	};

	static PARTS = {
		form: { template: "./modules/healthEstimate/templates/behaviorSettings.hbs" },
		...HealthEstimateSettingsV2.PARTS,
	};

	_prepareContext(options) {
		return {
			combatOnly: this.prepSetting("combatOnly"),
			showDescription: this.prepSelection("showDescription"),
			showDescriptionTokenType: this.prepSelection("showDescriptionTokenType"),

			deathState: this.prepSetting("deathState"),
			deathStateName: this.prepSetting("deathStateName"),
			NPCsJustDie: this.prepSetting("NPCsJustDie"),
			deathMarkerEnabled: game.healthEstimate.estimationProvider.deathMarker.config,
			deathMarker: this.prepSetting("deathMarker"),
			buttons: this._getButtons(),
		};
	}

	static async reset(event, form, formData) {
		const paths = [
			"combatOnly",
			"showDescription",
			"showDescriptionTokenType",
			"deathState",
			"deathStateName",
			"NPCsJustDie",
			"deathMarker",
		];

		await Promise.all(paths.map(this.resetToDefault));
		canvas.scene?.tokens.forEach((token) => token.object.refresh());
		this.close();
	}
}
