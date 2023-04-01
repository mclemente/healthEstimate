import { settingData, sGet, sSet, t } from "./utils.js";

class HealthEstimateSettings extends FormApplication {
	constructor(object, options = {}) {
		super(object, options);
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

	prepSelection(key, param = false) {
		const path = this.path + `.${key}`;
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
		const path = this.path + `.${key}`;
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
			await sSet(`core.${key}`, formData[key]);
		}
		canvas.scene?.tokens.forEach((token) => token.object.refresh());
	}
}

export class HealthEstimateBehaviorSettings extends HealthEstimateSettings {
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			title: `Health Estimate: ${t("core.menuSettings.behaviorSettings.plural")}`,
			template: "./modules/healthEstimate/templates/behaviorSettings.hbs",
			height: "auto",
			tabs: [{ navSelector: ".tabs", contentSelector: ".content", initial: "behavior" }],
		});
	}

	getData(options) {
		return {
			perfectionism: this.prepSelection("perfectionism"),
			alwaysShow: this.prepSetting("alwaysShow"),
			combatOnly: this.prepSetting("combatOnly"),
			showDescription: this.prepSelection("showDescription"),
			showDescriptionTokenType: this.prepSelection("showDescriptionTokenType"),

			deathState: this.prepSetting("deathState"),
			deathStateName: this.prepSetting("deathStateName"),
			NPCsJustDie: this.prepSetting("NPCsJustDie"),
			deathMarker: this.prepSetting("deathMarker"),
		};
	}

	async activateListeners(html) {
		super.activateListeners(html);
		html.find("button[name=reset]").on("click", async (event) => {
			async function resetToDefault(key) {
				const path = `core.${key}`;
				await game.settings.set("healthEstimate", path, game.settings.settings.get(`healthEstimate.${path}`).default);
			}
			await resetToDefault("perfectionism");
			await resetToDefault("alwaysShow");
			await resetToDefault("combatOnly");
			await resetToDefault("showDescription");
			await resetToDefault("showDescriptionTokenType");

			await resetToDefault("deathState");
			await resetToDefault("deathStateName");
			await resetToDefault("NPCsJustDie");
			await resetToDefault("deathMarker");
			this.render();
		});
	}
}

export class EstimationSettings extends HealthEstimateSettings {
	constructor(object, options = {}) {
		super(object, options);
		this.estimations = deepClone(sGet("core.estimations"));
		this.changeTabs = 0;
	}
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			title: `Health Estimate: ${t("core.estimationSettings.title")}`,
			template: "./modules/healthEstimate/templates/EstimationSettings.hbs",
			classes: ["form", "healthEstimate", "estimationSettings"],
			height: "auto",
			tabs: [{ navSelector: ".tabs", contentSelector: ".content", initial: "behavior" }],
			resizable: true,
		});
	}

	getData(options) {
		return {
			estimations: this.estimations,
		};
	}

	/**
	 * This is the earliest method called after render() where changing tabs can be called
	 * @param {*} html
	 */
	_activateCoreListeners(html) {
		super._activateCoreListeners(html);
		if (this.changeTabs) {
			const tabName = this.changeTabs.toString();
			if (tabName !== this._tabs[0].active) this._tabs[0].activate(tabName);
			this.changeTabs = 0;
		}
	}

	async activateListeners(html) {
		super.activateListeners(html);
		html.find("button[name=reset]").on("click", async (event) => {
			async function resetToDefault(key) {
				const path = `core.${key}`;
				await game.settings.set("healthEstimate", path, game.settings.settings.get(`healthEstimate.${path}`).default);
			}
			await resetToDefault("estimations");
			this.estimations = sGet("core.estimations");
			this.render();
		});

		// Handle all changes to tables
		html.find("a[data-action=add-table]").on("click", (event) => {
			this.changeTabs = this.estimations.length;
			this.estimations.push({
				name: "",
				rule: "",
				estimates: [
					{
						label: t("core.estimates.worst"),
						value: 0,
					},
					{
						label: t("core.estimates.best"),
						value: 100,
					},
				],
			});
			this.render();
		});
		html.find("button[data-action=table-delete]").on("click", (event) => {
			const idx = Number(event.target?.dataset.idx);
			this.estimations.splice(idx, 1);
			this.changeTabs = this.estimations.length - 1;
			this.render();
		});
		html.find("button[data-action=change-prio]").on("click", (event) => {
			const prio = event.target?.dataset.prio == "increase" ? -1 : 1;
			const idx = Number(event.target?.dataset.idx);
			function arraymove(arr, fromIndex, toIndex) {
				var element = arr[fromIndex];
				arr.splice(fromIndex, 1);
				arr.splice(toIndex, 0, element);
			}
			arraymove(this.estimations, idx, idx + prio);
			this.changeTabs = idx + prio;
			this.render();
		});

		// Handle all changes for estimations
		html.find("[data-action=estimation-add]").on("click", (event) => {
			// Fix for clicking either the A or I tag
			if (event.target.tagName == "A") {
				var idx = Number(event.target?.children[0].dataset.idx);
			} else idx = Number(event.target?.dataset.idx);
			this.estimations[idx].estimates.push({ label: "Custom", value: 100 });
			this.render();
		});
		for (const element of html[0].querySelectorAll("[data-action=estimation-delete]")) {
			element.addEventListener("click", async (event) => {
				const table = event.target?.dataset.table;
				const idx = Number(event.target?.dataset.idx);
				if (idx) this.estimations[table].estimates.splice(Number(idx), 1);
				this.render();
			});
		}
	}

	_getSubmitData(updateData) {
		const original = super._getSubmitData(updateData);
		const data = expandObject(original);
		let estimations = [];
		for (var key in data.estimations) {
			const estimates = data.estimations[key].estimates;
			const sortable = Object.keys(estimates)
				.sort(function (a, b) {
					return estimates[a].value - estimates[b].value;
				})
				.map((kkey) => estimates[kkey]);
			estimations.push({
				name: data.estimations[key].name,
				rule: data.estimations[key].rule,
				estimates: sortable,
			});
		}
		return { estimations };
	}
}

export class HealthEstimateStyleSettings extends HealthEstimateSettings {
	constructor(object, options = {}) {
		super(object, options);
		this.path = "core.menuSettings";
		this.gradFn = new Function();
		this.gradColors = [];
		Hooks.once("renderHealthEstimateStyleSettings", this.initHooks.bind(this));
		Hooks.once("closeHealthEstimateStyleSettings", () => {
			delete this.gp;
		});
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
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
			scaleToZoom: this.prepSetting("scaleToZoom"),
			deadText: game.settings.get("healthEstimate", "core.deathStateName"),
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
		this.fontSize.addEventListener("change", () => {
			if (!isNaN("x") && this.fontSize.value <= 0) this.fontSize.value = "1";
			this.updateSample();
		});
		for (let el of [this.textPosition, this.positionAdjustment]) {
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
		this.gradLength = this.smoothGradient.checked ? 100 : sGet("core.estimations")[0].estimates.length;
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
		this.deadOutline = this.outlFn(this.deadColor.value);
		sample.style.setProperty("font-size", this.fontSize.value);
		const deadSample = document.getElementById("healthEstimateSample").children[0];
		deadSample.style.color = this.deadColor.value;
		deadSample.style.textShadow = `-1px -1px 1px ${this.deadOutline}, 0 -1px 1px ${this.deadOutline}, 1px -1px 1px ${this.deadOutline},
		1px 0 1px ${this.deadOutline}, 1px 1px 1px ${this.deadOutline}, 0 1px 1px ${this.deadOutline},
		-1px 1px 1px ${this.deadOutline}, -1px 0 1px ${this.deadOutline}`;
		for (let i = 0; i <= 6; i++) {
			const index = Math.round(this.gradLength * ((i - 1) / 5));
			const position = Math.max(index - 1, 0);
			document.documentElement.style.setProperty(`--healthEstimate-keyframe-${index}`, this.gradColors[position]);
			document.documentElement.style.setProperty(`--healthEstimate-keyframe-${index}-outline`, this.outlColors[position]);
		}
	}

	clearDocument() {
		for (let i = 0; i <= 6; i++) {
			const index = Math.round(this.gradLength * ((i - 1) / 5));
			document.documentElement.style.setProperty(`--healthEstimate-keyframe-${index}`, null);
			document.documentElement.style.setProperty(`--healthEstimate-keyframe-${index}-outline`, null);
		}
	}

	async activateListeners(html) {
		super.activateListeners(html);
		html.find("button[name=reset]").on("click", async (event) => {
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
			await resetToDefault("scaleToZoom");
			this.close();
		});
	}

	async close(options = {}) {
		this.clearDocument();
		super.close(options);
	}

	async _updateObject(event, formData) {
		if (event.type === "submit") {
			const iterableSettings = Object.keys(formData).filter((key) => key.indexOf("outline") === -1);
			for (let key of iterableSettings) {
				await sSet(`core.menuSettings.${key}`, formData[key]);
			}
			let deadColor = formData.deadColor;
			if (!formData.useColor) {
				this.gradColors = ["#FFF"];
				this.outlColors = ["#000"];
				this.deadOutline = "#000";
				deadColor = "#FFF";
			}
			await sSet(`core.menuSettings.gradient`, {
				colors: this.gp.handlers.map((a) => a.color),
				positions: this.gp.handlers.map((a) => Math.round(a.position) / 100),
			});
			await sSet(`core.menuSettings.outline`, formData.outlineMode);
			await sSet(`core.menuSettings.outlineIntensity`, formData.outlineIntensity);

			await sSet(`core.variables.colors`, this.gradColors);
			await sSet(`core.variables.outline`, this.outlColors);
			await sSet(`core.variables.deadColor`, deadColor);
			await sSet(`core.variables.deadOutline`, this.deadOutline);
			canvas.scene?.tokens.forEach((token) => token.object.refresh());
		}
	}
}
