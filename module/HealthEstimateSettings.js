import { settingData, sGet, sSet, t } from "./utils.js";

class HealthEstimateSettings extends FormApplication {
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
				await sSet(`core.${key}`, value);
			})
		);
		if (game.healthEstimate.alwaysShow) canvas.scene?.tokens.forEach((token) => token.object.refresh());
	}
}

export class HealthEstimateBehaviorSettings extends HealthEstimateSettings {
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
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
			deathMarkerEnabled: settingData("core.deathMarker").config,
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

export class HealthEstimateEstimationSettings extends HealthEstimateSettings {
	constructor(object, options = {}) {
		super(object, options);
		this.estimations = deepClone(sGet("core.estimations"));
		this.changeTabs = null;
	}
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: "health-estimate-estimation-form",
			title: `Health Estimate: ${t("core.estimationSettings.title")}`,
			template: "./modules/healthEstimate/templates/EstimationSettings.hbs",
			classes: ["form", "healthEstimate", "estimationSettings"],
			height: "auto",
			tabs: [{ navSelector: ".tabs", contentSelector: ".content", initial: "behavior" }],
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
		if (this.changeTabs !== null) {
			const tabName = this.changeTabs.toString();
			if (tabName !== this._tabs[0].active) this._tabs[0].activate(tabName);
			this.changeTabs = null;
		}
	}

	async activateListeners(html) {
		super.activateListeners(html);
		html.find("button[name=reset]").on("click", async (event) => {
			await this.resetToDefault("estimations");
			this.estimations = sGet("core.estimations");
			canvas.scene?.tokens.forEach((token) => token.object.refresh());
			this.close();
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
			const { idx } = event.target?.dataset;
			this.estimations.splice(Number(idx), 1);
			this.changeTabs = Number(idx) - 1;
			this.render();
		});
		html.find("button[data-action=change-prio]").on("click", (event) => {
			const prio = event.target?.dataset.prio === "increase" ? -1 : 1;
			const idx = Number(event.target?.dataset.idx);

			const arraymove = (arr, fromIndex, toIndex) => {
				const element = arr[fromIndex];
				arr.splice(fromIndex, 1);
				arr.splice(toIndex, 0, element);
			};

			arraymove(this.estimations, idx, idx + prio);
			this.changeTabs = idx + prio;
			this.render();
		});
		for (const input of html[0].querySelectorAll(".form-group input, .form-group textarea")) {
			input.addEventListener("change", (event) => {
				const [_, tableIndex, property] = event.target.name.split(".");
				this.estimations[tableIndex][property] = event.target.value;
				event.preventDefault();
			});
		}

		// Handle all changes for estimations
		html.find("[data-action=estimation-add]").on("click", (event) => {
			// Fix for clicking either the A or I tag
			const idx = Number(event.target?.dataset.idx ?? event.target?.children[0]?.dataset.idx);
			this.estimations[idx].estimates.push({ label: "Custom", value: 100 });
			this.render();
		});
		for (const element of html[0].querySelectorAll("[data-action=estimation-delete]")) {
			element.addEventListener("click", async (event) => {
				const { table, idx } = event.target?.dataset ?? {};
				if (idx) this.estimations[table].estimates.splice(Number(idx), 1);
				this.render();
			});
		}
		for (const element of html[0].querySelectorAll(".estimation-types input")) {
			element.addEventListener("change", async (event) => {
				const [_, table, tableIndex, estimateIndex, rule] = event.target?.name.split(".");
				if (this.estimations[table]?.estimates?.[estimateIndex]?.[rule]) {
					this.estimations[table].estimates[estimateIndex][rule] = event.target?.value;
				}
				event.preventDefault();
			});
		}
	}

	_getSubmitData(updateData) {
		const original = super._getSubmitData(updateData);
		const data = expandObject(original);
		const estimations = [];
		for (const key in data.estimations) {
			const { name, rule, ignoreColor, estimates } = data.estimations[key];
			const sortedEstimates = Object.keys(estimates)
				.sort((a, b) => estimates[a].value - estimates[b].value)
				.map((innerKey) => estimates[innerKey]);
			estimations.push({ name, rule, ignoreColor, estimates: sortedEstimates });
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
			id: "health-estimate-style-form",
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
			position: this.prepSetting("position"),
			position2: this.prepSelection("position2"),
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
		const useColorCheckbox = document.querySelector('input[name="useColor"]');

		this.useColor = sGet("core.menuSettings.useColor");

		const deadColor = document.querySelector("input[name=deadColor]");
		this.deadColor = document.querySelector("input[data-edit=deadColor]");
		this.deadOutline = sGet("core.variables.deadOutline");

		this.outlineMode = document.getElementById("outlineMode");
		this.outlineIntensity = document.getElementById("outlineIntensity");
		this.fontSize = document.getElementById("fontSize");
		this.textPosition = document.getElementById("position");
		this.smoothGradient = document.getElementById("smoothGradient");
		this.gradEx = document.getElementById("gradientExampleHE");

		this.fontSize.value = Number.isNumeric(this.fontSize.value) ? this.fontSize.value : 24;
		this.textPosition.value = Number.isNumeric(this.textPosition.value) ? this.textPosition.value : "-65";

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

		for (let el of [deadColor, this.deadColor]) {
			el.addEventListener("change", (ev) => {
				this.deadOutline = this.outlFn(ev.target.value);
				this.deadColor.value = ev.target.value;
				this.updateSample();
			});
		}
		useColorCheckbox.addEventListener("change", (ev) => {
			this.useColor = !this.useColor;
			this.updateSample();
		});

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
		for (let el of [this.fontSize, this.textPosition]) {
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
		/**
		 *
		 * @param {Number} amount
		 * @param {[String]} colors
		 * @param {[Number]} colorPositions
		 * @returns {[String]}
		 */
		this.gradFn = (amount, colors, colorPositions) => {
			if (mode === "bez") return chroma.bezier(colors).scale().domain(colorPositions).colors(amount);
			else return chroma.scale(colors).mode(mode).domain(colorPositions).colors(amount);
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
			else return this.gradColors.map((c) => chroma(c)[outlineHandler](outlineAmount).hex());
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
		const sample = document.getElementById("healthEstimateSample");
		const sampleAnimation = document.getElementById("SampleAnimation");
		const deadSample = document.getElementById("healthEstimateSample").children[0];
		const deadColor = this.useColor ? this.deadColor.value : "#FFF";
		const deadOutline = this.useColor ? this.deadOutline : "#000";
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
		} catch (err) {
			console.error("Health Estimate | Error clearing document styles", err);
		}
	}

	async activateListeners(html) {
		super.activateListeners(html);
		html.find("button[name=reset]").on("click", async (event) => {
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
				"menuSettings.scaleToZoom",
				"variables.colors",
				"variables.outline",
				"variables.deadColor",
				"variables.deadOutline",
			];
			await Promise.all(paths.map(this.resetToDefault));
			this.close();
		});
	}

	async close(options = {}) {
		this.clearKeyframes();
		super.close(options);
	}

	async _updateObject(event, formData) {
		if (event.type !== "submit") return;
		const menuSettingsKeys = Object.keys(formData).filter((key) => key.indexOf("outline") === -1);
		const updates = menuSettingsKeys.map((key) => sSet(`core.menuSettings.${key}`, formData[key]));
		await Promise.all(updates);

		if (!formData.useColor) {
			this.gradColors = ["#FFF"];
			this.outlColors = ["#000"];
			this.deadOutline = "#000";
			formData.deadColor = "#FFF";
		}
		const variableUpdates = [
			sSet(`core.menuSettings.gradient`, {
				colors: this.gp.handlers.map((a) => a.color),
				positions: this.gp.handlers.map((a) => Math.round(a.position) / 100),
			}),
			sSet(`core.menuSettings.outline`, formData.outlineMode),
			sSet(`core.menuSettings.outlineIntensity`, formData.outlineIntensity),
			sSet(`core.variables.colors`, this.gradColors),
			sSet(`core.variables.outline`, this.outlColors),
			sSet(`core.variables.deadColor`, formData.deadColor),
			sSet(`core.variables.deadOutline`, this.deadOutline),
		];
		await Promise.all(variableUpdates);

		if (game.healthEstimate.alwaysShow) canvas.scene?.tokens.forEach((token) => token.object.refresh());
	}
}
