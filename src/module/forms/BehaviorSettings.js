import { t } from "../utils.js";
import { HealthEstimateSettingsV2 } from "./templates/BaseV2.js";

export default class HealthEstimateBehaviorSettings extends HealthEstimateSettingsV2 {
	static DEFAULT_OPTIONS = {
		actions: {
			reset: HealthEstimateBehaviorSettings.reset,
		},
		window: {
			icon: "fas fa-gear",
		},
	};

	static PARTS = {
		form: {
			id: "health-estimate-behavior-form",
			template: "./modules/healthEstimate/templates/behaviorSettings.hbs",
		},
		...HealthEstimateSettingsV2.PARTS,
	};

	get title() {
		return `Health Estimate: ${t("core.menuSettings.behaviorSettings.plural")}`;
	}

	_prepareContext(options) {
		return {
			alwaysShow: this.prepSetting("alwaysShow"),
			combatOnly: this.prepSetting("combatOnly"),
			showDescription: this.prepSelection("showDescription"),
			showDescriptionTokenType: this.prepSelection("showDescriptionTokenType"),

			deathState: this.prepSetting("deathState"),
			deathStateName: this.prepSetting("deathStateName"),
			NPCsJustDie: this.prepSetting("NPCsJustDie"),
			deathMarkerEnabled: game.healthEstimate.estimationProvider.deathMarker.config,
			deathMarker: this.prepSetting("deathMarker"),
			...HealthEstimateSettingsV2.BUTTONS,
		};
	}

	static async reset(event, form, formData) {
		const paths = [
			"alwaysShow",
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
