import { disableCheckbox } from "./settings.js";
import { sGet, sSet, settingData, t } from "./utils.js";

export class HealthEstimateDeathSettings extends FormApplication {
	constructor(object, options = {}) {
		super(object, options);
	}

	/**
	 * Default Options for this FormApplication
	 */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: "healthestimate-death-form",
			title: `Health Estimate: ${t("core.menuSettings.deathSettings.plural")}`,
			template: "./modules/healthEstimate/templates/deathSettings.hbs",
			classes: ["sheet"],
			width: 640,
			height: "auto",
			closeOnSubmit: true,
		});
	}

	getData(options) {
		function prepSetting(key) {
			const path = `core.${key}`;
			let data = settingData(path);
			return {
				value: sGet(path),
				name: data.name,
				hint: data.hint,
			};
		}

		return {
			deathState: prepSetting("deathState"),
			deathStateName: prepSetting("deathStateName"),
			NPCsJustDie: prepSetting("NPCsJustDie"),
			deathMarker: prepSetting("deathMarker"),
		};
	}

	async activateListeners(html) {
		super.activateListeners(html);
		const deathState = game.settings.get("healthEstimate", "core.deathState");
		const deathStateBox = html.find('input[name="deathState"]');
		const deathStateNameInput = html.find('input[name="deathStateName"]');
		const NPCsJustDieInput = html.find('input[name="NPCsJustDie"]');
		const deathMarkerInput = html.find('input[name="deathMarker"]');
		disableCheckbox(deathStateNameInput, !deathState);
		disableCheckbox(NPCsJustDieInput, !deathState);
		disableCheckbox(deathMarkerInput, !deathState);
		deathStateBox.on("change", (event) => {
			disableCheckbox(deathStateNameInput, !event.target.checked);
			disableCheckbox(NPCsJustDieInput, !event.target.checked);
			disableCheckbox(deathMarkerInput, !event.target.checked);
		});
		html.find("button").on("click", async (event) => {
			if (event.currentTarget?.dataset?.action === "reset") {
				async function resetToDefault(key) {
					const path = `core.${key}`;
					await game.settings.set("healthEstimate", path, game.settings.settings.get(`healthEstimate.${path}`).default);
				}

				await resetToDefault("deathState");
				await resetToDefault("deathStateName");
				await resetToDefault("NPCsJustDie");
				await resetToDefault("deathMarker");
				this.close();
			}
		});
	}

	/**
	 * Executes on form submission
	 * @param {Event} event - the form submission event
	 * @param {Object} formData - the form data
	 */
	async _updateObject(event, formData) {
		const iterableSettings = Object.keys(formData);
		for (let key of iterableSettings) {
			sSet(`core.${key}`, formData[key]);
		}
	}
}
