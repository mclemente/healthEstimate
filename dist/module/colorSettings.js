export class ColorSettings extends FormApplication {
	
	constructor(object, options = {}) {
		super(object, options);
	}
	
	/**
	 * Default Options for this FormApplication
	 */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: "healthestimate-colors-form",
			title: "Health Estimate Color Settings",
			template: "./modules/healthEstimate/templates/settings.hbs",
			classes: ["sheet"],
			width: 600,
			closeOnSubmit: true
		});
	}
}