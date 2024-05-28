import { t } from "../utils.js";
import { HealthEstimateSettings } from "./templates/Base.js";

export default class HealthEstimateBehaviorSettings extends HealthEstimateSettings {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			id: "health-estimate-behavior-form",
			title: `Health Estimate: ${t("core.menuSettings.behaviorSettings.plural")}`,
			template: "./modules/healthEstimate/templates/behaviorSettings.hbs",
			height: "auto",
		});
	}

	getData(options) {
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
		};
	}

	async activateListeners(html) {
		super.activateListeners(html);

		html.find("button[name=reset]").on("click", async (event) => {
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
		});
	}
}
