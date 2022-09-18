import { disableCheckbox } from "./settings.js";
import { sGet, sSet, settingData, t } from "./utils.js";

export class HealthEstimateSettings extends FormApplication {
	/**
	 * Default Options for this FormApplication
	 */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["sheet"],
			width: 640,
			height: "fit-content",
			closeOnSubmit: true,
		});
	}

	prepSelection(key, param = false) {
		const path = `core.${key}`;
		let data = settingData(path);
		let current = "";
		let result = {
			select: [],
			name: data.name,
			hint: data.hint,
		};

		if (param) {
			let currentObject = sGet(path);
			current = currentObject[param];
			// for (let [k, v] of Object.entries((currentObject))) {
			// 	result[k] = v
			// }
			Object.assign(result, currentObject);
		} else {
			current = sGet(path);
		}

		for (let [k, v] of Object.entries(data.choices)) {
			result.select.push({
				key: k,
				value: v,
				selected: k == current,
			});
		}
		return result;
	}

	prepSetting(key) {
		const path = `core.${key}`;
		let data = settingData(path);
		return {
			value: sGet(path),
			name: data.name,
			hint: data.hint,
		};
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

export class HealthEstimateBehaviorSettings extends HealthEstimateSettings {
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: "healthestimate-behavior-form",
			title: `Health Estimate: ${t("core.menuSettings.deathSettings.plural")}`,
			template: "./modules/healthEstimate/templates/behaviorSettings.hbs",
		});
	}

	getData(options) {
		return {
			perfectionism: this.prepSelection("perfectionism"),
			alwaysShow: this.prepSetting("alwaysShow"),
			combatOnly: this.prepSetting("combatOnly"),
			showDescription: this.prepSelection("showDescription"),
			showDescriptionTokenType: this.prepSelection("showDescriptionTokenType"),
		};
	}

	async activateListeners(html) {
		super.activateListeners(html);
		html.find("button").on("click", async (event) => {
			if (event.currentTarget?.dataset?.action === "reset") {
				async function resetToDefault(key) {
					const path = `core.${key}`;
					await game.settings.set("healthEstimate", path, game.settings.settings.get(`healthEstimate.${path}`).default);
				}
				await resetToDefault("perfectionism");
				await resetToDefault("alwaysShow");
				await resetToDefault("combatOnly");
				await resetToDefault("showDescription");
				await resetToDefault("showDescriptionTokenType");
				this.close();
			}
		});
	}
}

export class HealthEstimateDeathSettings extends HealthEstimateSettings {
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: "healthestimate-death-form",
			title: `Health Estimate: ${t("core.menuSettings.deathSettings.plural")}`,
			template: "./modules/healthEstimate/templates/deathSettings.hbs",
		});
	}

	getData(options) {
		return {
			deathState: this.prepSetting("deathState"),
			deathStateName: this.prepSetting("deathStateName"),
			NPCsJustDie: this.prepSetting("NPCsJustDie"),
			deathMarker: this.prepSetting("deathMarker"),
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
}

export class HealthEstimateStyleSettings extends HealthEstimateSettings {
	constructor(object, options = {}) {
		super(object, options);
		this.gradFn = new Function();
		this.gradColors = [];
		Hooks.once("renderHealthEstimateStyleSettings", this.initHooks.bind(this));
		Hooks.once("closeHealthEstimateStyleSettings", () => {
			delete this.gp;
		});
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: "healthestimate-style-form",
			title: `Health Estimate: ${t("core.menuSettings.styleSettings.plural")}`,
			template: "./modules/healthEstimate/templates/styleSettings.hbs",
		});
	}

	getData(options) {
		return {
			useColor: this.prepSetting("useColor"),
			smoothGradient: this.prepSetting("smoothGradient"),
			deadColor: this.prepSetting("deadColor"),
			fontSize: this.prepSetting("fontSize"),
			positionAdjustment: this.prepSetting("positionAdjustment"),
			position: this.prepSelection("position"),
			mode: this.prepSelection("mode"),
			outline: this.prepSelection("outline"),
			outlineIntensity: this.prepSetting("outlineIntensity"),
		};
	}

	prepSelection(key, param = false) {
		const path = `core.menuSettings.${key}`;
		let data = settingData(path);
		let current = "";
		let result = {
			select: [],
			name: data.name,
			hint: data.hint,
		};

		if (param) {
			let currentObject = sGet(path);
			current = currentObject[param];
			// for (let [k, v] of Object.entries((currentObject))) {
			// 	result[k] = v
			// }
			Object.assign(result, currentObject);
		} else {
			current = sGet(path);
		}

		for (let [k, v] of Object.entries(data.choices)) {
			result.select.push({
				key: k,
				value: v,
				selected: k == current,
			});
		}
		return result;
	}

	prepSetting(key) {
		const path = `core.menuSettings.${key}`;
		let data = settingData(path);
		return {
			value: sGet(path),
			name: data.name,
			hint: data.hint,
		};
	}

	initHooks() {
		const gradientPositions = game.settings.get(`healthEstimate`, `core.menuSettings.gradient`);
		const mode = document.getElementById(`mode`);

		this.deadColor = document.querySelector("input[data-edit=deadColor]");
		this.deadOutline = sGet("core.variables.deadOutline");

		this.outlineMode = document.getElementById("outlineMode");
		this.outlineIntensity = document.getElementById("outlineIntensity");
		this.fontSize = document.getElementById("fontSize");
		this.textPosition = document.getElementById("position");
		this.positionAdjustment = document.getElementById("positionAdjustment");
		this.smoothGradient = document.getElementById("smoothGradient");
		this.gradEx = document.getElementById("gradientExampleHE");

		this.gp = new Grapick({
			el: "#gradientControlsHE",
			colorEl: '<input id="colorpicker"/>',
		});
		this.gp.setColorPicker((handler) => {
			const el = handler.getEl().querySelector("#colorpicker");

			$(el).spectrum({
				color: handler.getColor(),
				showAlpha: true,
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
			this.updateSample();
		});

		this.gp.on("change", (complete) => {
			this.updateGradient();
		});
		for (let el of [this.outlineIntensity, this.outlineMode, mode]) {
			el.addEventListener("change", () => {
				this.updateGradientFunction();
			});
		}
		this.smoothGradient.addEventListener("change", () => {
			this.updateGradient();
		});
		for (let el of [this.fontSize, this.textPosition, this.positionAdjustment]) {
			el.addEventListener("change", () => {
				this.updateSample();
			});
		}
	}

	async setHandlers(positions) {
		for (let [i, v] of positions.colors.entries()) {
			this.gp.addHandler(positions.positions[i] * 100, v);
		}
	}

	updateGradientFunction() {
		const mode = document.getElementById(`mode`).value;
		const colorHandler = mode === "bez" ? `bezier(colors).scale()` : `scale(colors).mode('${mode}')`;

		this.gradFn = new Function(`amount`, `colors`, `colorPositions`, `return (chroma.${colorHandler}.domain(colorPositions).colors(amount))`);

		this.updateOutlineFunction();
		this.updateGradient();
	}
	updateOutlineFunction() {
		const outlineHandler = this.outlineMode.value;
		const outlineAmount = this.outlineIntensity.value;

		this.outlFn = new Function(
			"color=false",
			`let res = []
			if (color) {
				res = chroma(color).${outlineHandler}(${outlineAmount}).hex() 
			} else {
				for (c of this.gradColors) {
					res.push(chroma(c).${outlineHandler}(${outlineAmount}).hex())
				}
			}
			return res`
		);
	}

	updateGradient() {
		const colors = this.gp.handlers.map((a) => a.color);
		const colorPositions = this.gp.handlers.map((a) => Math.round(a.position) / 100);
		this.gradLength = this.smoothGradient.checked ? 100 : sGet("core.stateNames").split(/[,;]\s*/).length;
		const width = 100 / this.gradLength;
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
		// (chroma.bezier(colors).scale().domain(positions).mode('cmyk'))(i / 100).hex()
		this.gradEx.innerHTML = gradString;
		this.updateSample();
	}

	updateSample() {
		const sample = document.getElementById("healthEstimateSample");
		const sampleItems = sample.children[0].children;

		this.deadOutline = this.outlFn(this.deadColor.value);

		sample.style.setProperty("--healthEstimate-text-size", this.fontSize.value);
		// sample.style.setProperty("--healthEstimate-alignment", this.textPosition.value);
		// sample.style.setProperty("--healthEstimate-margin", `${this.positionAdjustment.value}em`);
		sampleItems[0].style.setProperty("--healthEstimate-text-color", this.deadColor.value);
		sampleItems[0].style.setProperty("--healthEstimate-stroke-color", this.deadOutline);

		for (let i = 1; i <= 6; i++) {
			const position = Math.max(Math.round(this.gradLength * ((i - 1) / 5)) - 1, 0);

			sampleItems[i].style.setProperty("--healthEstimate-text-color", this.gradColors[position]);
			sampleItems[i].style.setProperty("--healthEstimate-stroke-color", this.outlColors[position]);
		}
	}

	async activateListeners(html) {
		super.activateListeners(html);
		html.find("button").on("click", async (event) => {
			if (event.currentTarget?.dataset?.action === "reset") {
				async function resetToDefault(key) {
					const path = `core.menuSettings.${key}`;
					await game.settings.set("healthEstimate", path, game.settings.settings.get(`healthEstimate.${path}`).default);
				}

				await resetToDefault("useColor");
				await resetToDefault("smoothGradient");
				await resetToDefault("deadColor");
				await resetToDefault("fontSize");
				await resetToDefault("positionAdjustment");
				await resetToDefault("position");
				await resetToDefault("mode");
				await resetToDefault("outline");
				await resetToDefault("outlineIntensity");
				this.close();
			}
		});
	}

	async _updateObject(event, formData) {
		const iterableSettings = Object.keys(formData).filter((key) => key.indexOf("outline") === -1);

		for (let key of iterableSettings) {
			sSet(`core.menuSettings.${key}`, formData[key]);
		}

		let deadColor = formData.deadColor;
		if (!formData.useColor) {
			this.gradColors = ["#FFF"];
			this.outlColors = ["#000"];
			this.deadOutline = "#000";
			deadColor = "#FFF";
		}

		sSet(`core.menuSettings.gradient`, {
			colors: this.gp.handlers.map((a) => a.color),
			positions: this.gp.handlers.map((a) => Math.round(a.position) / 100),
		});
		sSet(`core.menuSettings.outline`, formData.outlineMode);
		sSet(`core.menuSettings.outlineIntensity`, formData.outlineIntensity);

		sSet(`core.variables.colors`, this.gradColors);
		sSet(`core.variables.outline`, this.outlColors);
		sSet(`core.variables.deadColor`, deadColor);
		sSet(`core.variables.deadOutline`, this.deadOutline);

		setTimeout(game.healthEstimate.updateSettings, 50);
	}
}
