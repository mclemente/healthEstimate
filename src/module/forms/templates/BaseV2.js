import { settingData, sGet, sSet } from "../../utils.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class HealthEstimateSettingsV2 extends HandlebarsApplicationMixin(ApplicationV2) {
	path = "core";

	static DEFAULT_OPTIONS = {
		classes: ["form", "healthEstimate"],
		position: {
			width: 780,
			height: 680,
		},
		form: {
			handler: HealthEstimateSettingsV2.#onSubmit,
			closeOnSubmit: true,
		},
		tag: "form",
		window: {
			contentClasses: ["standard-form"],
		},
	};

	static PARTS = {
		footer: {
			template: "templates/generic/form-footer.hbs",
		},
	};

	_getButtons() {
		return [
			{ type: "submit", icon: "fa-solid fa-save", label: "SETTINGS.Save" },
			{ type: "reset", action: "reset", icon: "fa-solid fa-undo", label: "SETTINGS.Reset" },
		];
	}

	get title() {
		return `Health Estimate: ${game.i18n.localize(this.options.window.title)}`;
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
	static async #onSubmit(event, form, formData) {
		const settings = foundry.utils.expandObject(formData.object);
		await Promise.all(Object.entries(settings).map(([key, value]) => sSet(`core.${key}`, value)));
		if (game.healthEstimate.alwaysShow) canvas.scene?.tokens.forEach((token) => token.object.refresh());
	}
}
