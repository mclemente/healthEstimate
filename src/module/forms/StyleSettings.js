import { sGet, sSet, t } from "../utils.js";
import { HealthEstimateSettingsV2 } from "./templates/BaseV2.js";

export default class HealthEstimateStyleSettings extends HealthEstimateSettingsV2 {
	gradColors = [];

	path = "core.menuSettings";

	static DEFAULT_OPTIONS = {
		actions: {
			reset: HealthEstimateStyleSettings.reset,
		},
		form: {
			handler: HealthEstimateStyleSettings.#onSubmit,
		},
		window: {
			icon: "fas fa-palette",
		},
	};

	static PARTS = {
		form: {
			id: "health-estimate-style-form",
			template: "./modules/healthEstimate/templates/styleSettings.hbs",
		},
		...HealthEstimateSettingsV2.PARTS,
	};

	get title() {
		return `Health Estimate: ${t("core.menuSettings.styleSettings.plural")}`;
	}

	_prepareContext(options) {
		return {
			fontFamily: this.prepSelection("fontFamily"),
			useColor: this.prepSetting("useColor"),
			smoothGradient: this.prepSetting("smoothGradient"),
			deadColor: this.prepSetting("deadColor"),
			fontSize: this.prepSetting("fontSize"),
			position: this.prepSetting("position"),
			position2: this.prepSelection("position2"),
			mode: this.prepSelection("mode"),
			outline: this.prepSelection("outline"),
			outlineIntensity: this.prepSetting("outlineIntensity"),
			scaleToGridSize: this.prepSetting("scaleToGridSize"),
			scaleToZoom: this.prepSetting("scaleToZoom"),
			deadText: game.settings.get("healthEstimate", "core.deathStateName"),
			...HealthEstimateSettingsV2.BUTTONS,
		};
	}

	_onRender(context, options) {
		const gradientPositions = game.settings.get("healthEstimate", "core.menuSettings.gradient");
		const mode = this.element.querySelector("#mode");
		const useColorCheckbox = this.element.querySelector('input[name="useColor"]');

		this.fontFamily = this.element.querySelector("#fontFamily");
		this.useColor = sGet("core.menuSettings.useColor");

		this.deadColor = this.element.querySelector("color-picker[name=deadColor]");
		this.deadOutline = sGet("core.variables.deadOutline");

		this.outlineMode = this.element.querySelector("#outlineMode");
		this.outlineIntensity = this.element.querySelector("input[name=outlineIntensity]");
		this.fontSize = this.element.querySelector("input[name=fontSize]");
		this.textPosition = this.element.querySelector("input[name=position]");
		this.smoothGradient = this.element.querySelector("#smoothGradient");
		this.gradEx = this.element.querySelector("#gradientExampleHE");

		this.fontSize.value = Number.isNumeric(this.fontSize.value) ? this.fontSize.value : 24;
		this.textPosition.value = Number.isNumeric(this.textPosition.value) ? this.textPosition.value : 0;

		const gradientForm = this.element.querySelector('div[class="form-group gradient"]');

		this.hideForm(this.smoothGradient.parentElement, this.useColor);
		this.hideForm(gradientForm, this.useColor);
		this.hideForm(this.deadColor.parentElement, this.useColor);
		this.hideForm(this.outlineMode.parentElement, this.useColor);

		this.gp = new Grapick({
			el: "#gradientControlsHE",
			colorEl: '<input id="colorpicker"/>',
		});
		this.gp.setColorPicker((handler) => {
			const el = handler.getEl().querySelector("#colorpicker");

			$(el).spectrum({
				color: handler.getColor(),
				showAlpha: false,
				change(color) {
					handler.setColor(color.toRgbString());
				},
				move(color) {
					handler.setColor(color.toRgbString(), 0);
				},
			});
		});
		this.setHandlers(gradientPositions).then(() => {
			this.updateGradientFunction();
		});

		this.deadColor.addEventListener("change", (ev) => {
			this.deadOutline = this.outlFn(ev.target.value);
			// this.deadColor.value = ev.target.value;
			this.updateSample();
		});
		useColorCheckbox.addEventListener("change", (ev) => {
			this.useColor = !this.useColor;
			this.updateSample();
			this.hideForm(this.smoothGradient.parentElement, ev.target.checked);
			this.hideForm(gradientForm, ev.target.checked);
			this.hideForm(this.deadColor.parentElement, ev.target.checked);
			this.hideForm(this.outlineMode.parentElement, ev.target.checked);
		});

		for (const range of this.element.querySelectorAll("input[type=range]")) {
			range.addEventListener("change", (event) => {
				range.nextElementSibling.innerHTML = event.target.value;
			});
		}
		this.gp.on("change", (complete) => {
			this.updateGradient();
		});
		for (let el of [this.outlineIntensity, this.outlineMode, mode]) {
			el.addEventListener("change", () => {
				this.updateGradientFunction();
				this.updateSample();
			});
		}
		this.smoothGradient.addEventListener("change", () => {
			this.updateGradient();
		});
		for (let el of [this.fontFamily, this.fontSize, this.textPosition]) {
			el.addEventListener("change", () => {
				this.updateSample();
			});
		}
	}

	hideForm(form, boolean) {
		form.style.display = !boolean ? "none" : "flex";
	}

	async setHandlers(positions) {
		for (let [i, v] of positions.colors.entries()) {
			this.gp.addHandler(positions.positions[i] * 100, v);
		}
	}

	updateGradientFunction() {
		const mode = this.element.querySelector("#mode").value;
		/**
		 *
		 * @param {Number} amount
		 * @param {[String]} colors
		 * @param {[Number]} colorPositions
		 * @returns {[String]}
		 */
		this.gradFn = (amount, colors, colorPositions) => {
			if (mode === "bez") return chroma.bezier(colors).scale().domain(colorPositions).colors(amount);
			return chroma.scale(colors).mode(mode).domain(colorPositions).colors(amount);
		};

		this.updateOutlineFunction();
		this.updateGradient();
	}

	updateOutlineFunction() {
		const outlineHandler = this.outlineMode.value;
		const outlineAmount = this.outlineIntensity.value;

		/**
		 * @param {Boolean} color
		 * @returns {[String]}
		 */
		this.outlFn = (color = false) => {
			if (color) return chroma(color)[outlineHandler](outlineAmount).hex();
			return this.gradColors.map((c) => chroma(c)[outlineHandler](outlineAmount).hex());
		};
	}

	updateGradient() {
		this.gradLength = this.smoothGradient.checked ? 100 : sGet("core.estimations")[0].estimates.length;
		const width = 100 / this.gradLength;
		const colors = this.gp.handlers.map((a) => a.color);
		const colorPositions = this.gp.handlers.map((a) => Math.round(a.position) / 100);
		this.gradColors = this.gradFn(this.gradLength, colors, colorPositions);
		this.outlColors = this.outlFn();
		let gradString = "";

		for (let i = 0; i < this.gradLength; i++) {
			gradString += `<span style="
					display:inline-block;
					height:30px;
					width:${width}%;
					background-color:${this.gradColors[i]};
				"></span>`;
		}
		this.gradEx.innerHTML = gradString;
		this.updateSample();
	}

	updateSample() {
		const sample = this.element.querySelector("#healthEstimateSample");
		const sampleAnimation = this.element.querySelector("#SampleAnimation");
		const deadSample = this.element.querySelector("#healthEstimateSample").children[0];
		const deadColor = this.useColor ? this.deadColor.value : "#FFF";
		const deadOutline = this.useColor ? this.deadOutline : "#000";
		sample.style.fontFamily = this.fontFamily.value;
		sample.style.fontSize = `${this.fontSize.value}px`;

		deadSample.style.color = deadColor;
		deadSample.style.textShadow = `-1px -1px 1px ${deadOutline}, 0 -1px 1px ${deadOutline}, 1px -1px 1px ${deadOutline},
			1px 0 1px ${deadOutline}, 1px 1px 1px ${deadOutline}, 0 1px 1px ${deadOutline},
			-1px 1px 1px ${deadOutline}, -1px 0 1px ${deadOutline}`;

		if (this.useColor) {
			sampleAnimation.classList.add("healthEstimateAnimate");
			for (let i = 1; i <= 6; i++) {
				const index = Math.round(this.gradLength * ((i - 1) / 5));
				const position = Math.max(index - 1, 0);
				const keyframe = `--healthEstimate-keyframe-${index}`;
				const outlineKeyframe = `${keyframe}-outline`;
				const gradColor = this.gradColors[position];
				const outlColor = this.outlColors[position];

				document.documentElement.style.setProperty(keyframe, gradColor);
				document.documentElement.style.setProperty(outlineKeyframe, outlColor);
			}
		} else {
			sampleAnimation.classList.remove("healthEstimateAnimate");
			this.clearKeyframes();
		}
	}

	clearKeyframes() {
		try {
			for (let i = 0; i <= 6; i++) {
				const index = Math.round(this.gradLength * ((i - 1) / 5));
				document.documentElement.style.setProperty(`--healthEstimate-keyframe-${index}`, null);
				document.documentElement.style.setProperty(`--healthEstimate-keyframe-${index}-outline`, null);
			}
		} catch(err) {
			console.error("Health Estimate | Error clearing document styles", err);
		}
	}

	static async reset() {
		const paths = [
			"menuSettings.useColor",
			"menuSettings.smoothGradient",
			"menuSettings.deadColor",
			"menuSettings.fontSize",
			"menuSettings.position",
			"menuSettings.position2",
			"menuSettings.mode",
			"menuSettings.outline",
			"menuSettings.outlineIntensity",
			"menuSettings.scaleToGridSize",
			"menuSettings.scaleToZoom",
			"variables.colors",
			"variables.outline",
			"variables.deadColor",
			"variables.deadOutline",
		];
		await Promise.all(paths.map(this.resetToDefault));
		this.close();
	}

	async close(options = {}) {
		this.clearKeyframes();
		// delete this.gp;
		super.close(options);
	}

	static async #onSubmit(event, form, formData) {
		const settings = foundry.utils.expandObject(formData.object);
		const menuSettingsKeys = Object.keys(settings).filter((key) => key.indexOf("outline") === -1);
		const updates = menuSettingsKeys.map((key) => sSet(`core.menuSettings.${key}`, settings[key]));
		await Promise.all(updates);

		if (!settings.useColor) {
			this.gradColors = ["#FFF"];
			this.outlColors = ["#000"];
			this.deadOutline = "#000";
			settings.deadColor = "#FFF";
		}
		const variableUpdates = [
			sSet("core.menuSettings.gradient", {
				colors: this.gp.handlers.map((a) => a.color),
				positions: this.gp.handlers.map((a) => Math.round(a.position) / 100),
			}),
			sSet("core.menuSettings.outline", settings.outlineMode),
			sSet("core.menuSettings.outlineIntensity", settings.outlineIntensity),
			sSet("core.variables.colors", this.gradColors),
			sSet("core.variables.outline", this.outlColors),
			sSet("core.variables.deadColor", settings.deadColor),
			sSet("core.variables.deadOutline", this.deadOutline),
		];
		await Promise.all(variableUpdates);

		if (game.healthEstimate.alwaysShow) canvas.scene?.tokens.forEach((token) => token.object.refresh());
	}
}
