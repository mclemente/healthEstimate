import { settingData, sGet, sSet } from "../../utils.js";

export class HealthEstimateSettings extends FormApplication {
	constructor(object, options = {}) {
		super(object, options);
		/** Set path property */
		this.path = "core";
	}

	/**
	 * Default Options for this FormApplication
	 */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["form", "healthEstimate"],
			width: 640,
			height: "fit-content",
			closeOnSubmit: true,
		});
	}

	prepSelection(key) {
		const path = `${this.path}.${key}`;
		const data = settingData(path);
		const { name, hint } = data;
		const selected = sGet(path);
		const select = Object.entries(data.choices).map(([key, value]) => ({ key, value }));
		return { select, name, hint, selected };
	}

	prepSetting(key) {
		const path = `${this.path}.${key}`;
		const { name, hint } = settingData(path);
		return {
			value: sGet(path),
			name,
			hint,
		};
	}

	async resetToDefault(key) {
		const path = `core.${key}`;
		const defaultValue = game.settings.settings.get(`healthEstimate.${path}`).default;
		await game.settings.set("healthEstimate", path, defaultValue);
		if (game.healthEstimate.alwaysShow) canvas.scene?.tokens.forEach((token) => token.object.refresh());
	}

	/**
	 * Executes on form submission
	 * @param {Event} event - the form submission event
	 * @param {Object} formData - the form data
	 */
	async _updateObject(event, formData) {
		await Promise.all(
			Object.entries(formData).map(async ([key, value]) => {
				let current = game.settings.get("healthEstimate", `core.${key}`);
				// eslint-disable-next-line eqeqeq
				if (value != current) await sSet(`core.${key}`, value);
			})
		);
		if (game.healthEstimate.alwaysShow) canvas.scene?.tokens.forEach((token) => token.object.refresh());
	}
}

