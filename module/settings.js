import { outputStageChange } from "../lib/HealthMonitor.js";
import { injectConfig } from "../lib/injectConfig.js";
import { EstimationSettings, HealthEstimateBehaviorSettings, HealthEstimateStyleSettings } from "./HealthEstimateSettings.js";
import { addSetting, f, t } from "./utils.js";

export const registerSettings = function () {
	/**
	 * Shorthand for addSetting.
	 * Default data: {scope: "world", config: false}
	 * @param {string} key
	 * @param {object} data
	 */
	function addMenuSetting(key, data) {
		const commonData = {
			name: t(`${key}.name`),
			hint: t(`${key}.hint`),
			scope: "world",
			config: false,
		};
		game.settings.register("healthEstimate", key, Object.assign(commonData, data));
	}

	game.settings.registerMenu("healthEstimate", "behaviorSettings", {
		name: t("core.menuSettings.behaviorSettings.plural"),
		label: t("core.menuSettings.behaviorSettings.plural"),
		icon: "fas fa-gear",
		type: HealthEstimateBehaviorSettings,
		restricted: true,
	});
	game.settings.registerMenu("healthEstimate", "estimationSettings", {
		name: "Estimation Settings",
		label: "Estimation Settings",
		icon: "fas fa-scale-balanced",
		type: EstimationSettings,
		restricted: true,
	});
	game.settings.registerMenu("healthEstimate", "styleSettings", {
		name: t("core.menuSettings.styleSettings.plural"),
		label: t("core.menuSettings.styleSettings.plural"),
		icon: "fas fa-palette",
		type: HealthEstimateStyleSettings,
		restricted: true,
	});

	/* Settings for the main settings menu */

	addSetting("core.stateNames", {
		type: String,
		default: "",
		config: false,
	});
	addMenuSetting("core.estimations", {
		type: Array,
		default: game.healthEstimate.estimationProvider.estimations,
		onChange: (value) => {
			game.healthEstimate.estimations = value;
			canvas.scene?.tokens.forEach((token) => token.object.refresh());
		},
	});
	addSetting("core.outputChat", {
		hint: f("core.outputChat.hint", { setting: t("core.unknownEntity.name") }),
		type: Boolean,
		default: false,
		onChange: (value) => {
			if (value) {
				Hooks.on("updateActor", onUpdateActor);
				if (!game.version > 11) Hooks.on("updateToken", onUpdateToken);
			} else {
				Hooks.off("updateActor", onUpdateActor);
				if (!game.version > 11) Hooks.off("updateToken", onUpdateToken);
			}
		},
	});
	addSetting("core.unknownEntity", {
		type: String,
		default: game.i18n.localize("healthEstimate.core.unknownEntity.default"),
	});

	/* Settings for the behavior menu */
	addMenuSetting("core.alwaysShow", {
		type: Boolean,
		default: false,
		onChange: (value) => {
			game.healthEstimate.alwaysShow = value;
			if (value) {
				Hooks.on("updateActor", game.healthEstimate.alwaysOnUpdateActor);
				if (!game.version > 11) Hooks.on("updateToken", alwaysOnUpdateToken);
			} else {
				Hooks.off("updateActor", game.healthEstimate.alwaysOnUpdateActor);
				if (!game.version > 11) Hooks.off("updateToken", alwaysOnUpdateToken);
			}
		},
	});
	addMenuSetting("core.combatOnly", {
		type: Boolean,
		default: false,
		onChange: (value) => {
			game.healthEstimate.combatOnly = value;
			game.healthEstimate.combatHooks(value);
		},
	});
	addMenuSetting("core.showDescription", {
		type: Number,
		default: 0,
		choices: {
			0: t("core.showDescription.choices.all"),
			1: t("core.showDescription.choices.GM"),
			2: t("core.showDescription.choices.Players"),
		},
		onChange: () => {
			game.healthEstimate.updateBreakConditions();
		},
	});
	addMenuSetting("core.showDescriptionTokenType", {
		type: Number,
		default: 0,
		choices: {
			0: t("core.showDescription.choices.all"),
			1: t("core.showDescription.choices.PC"),
			2: t("core.showDescription.choices.NPC"),
		},
		onChange: () => {
			game.healthEstimate.updateBreakConditions();
		},
	});

	/* Settings for the death menu */
	addMenuSetting("core.deathState", {
		hint: f("core.deathState.hint", { setting: t("core.deathStateName.name"), setting2: t("core.deathMarker.name") }),
		type: Boolean,
		default: game.healthEstimate.estimationProvider.deathState,
		onChange: (value) => {
			game.healthEstimate.showDead = value;
		},
	});
	addMenuSetting("core.deathStateName", {
		type: String,
		default: game.healthEstimate.estimationProvider.deathStateName,
		onChange: (value) => {
			game.healthEstimate.deathStateName = value;
		},
	});
	addMenuSetting("core.NPCsJustDie", {
		type: Boolean,
		hint: f("core.NPCsJustDie.hint", { setting: t("core.deathStateName.name") }),
		default: true,
		onChange: (value) => {
			game.healthEstimate.NPCsJustDie = value;
		},
	});
	addMenuSetting("core.deathMarker", {
		type: String,
		default: CONFIG.statusEffects.find((x) => x.id === "dead")?.icon || "icons/svg/skull.svg",
		onChange: (value) => {
			game.healthEstimate.deathMarker = value;
		},
	});

	/* Settings for the custom menu */
	addMenuSetting("core.menuSettings.useColor", {
		type: Boolean,
		default: true,
	});
	addMenuSetting("core.menuSettings.scaleToZoom", {
		hint: f("core.menuSettings.scaleToZoom.hint", { setting: t("core.menuSettings.fontSize.name"), setting2: t("core.menuSettings.position.name") }),
		type: Boolean,
		default: false,
		onChange: (value) => {
			game.healthEstimate.scaleToZoom = value;
		},
	});
	addMenuSetting("core.menuSettings.smoothGradient", {
		type: Boolean,
		default: true,
		onChange: (value) => {
			game.healthEstimate.smoothGradient = value;
		},
	});
	addMenuSetting("core.menuSettings.gradient", {
		type: Object,
		default: {
			colors: [`#FF0000`, `#00FF00`],
			positions: [0, 1],
		},
	});
	addMenuSetting(`core.menuSettings.mode`, {
		type: String,
		default: `hsl`,
		choices: {
			bez: "Bezier",
			rgb: "RGB",
			hsl: "HSL",
			lch: "LCH",
		},
	});
	addMenuSetting("core.menuSettings.deadColor", {
		type: String,
		default: "#990000",
	});
	addMenuSetting("core.menuSettings.outline", {
		type: String,
		default: "darken",
		choices: {
			darken: t("core.menuSettings.outline.darken"),
			brighten: t("core.menuSettings.outline.brighten"),
		},
	});
	addMenuSetting("core.menuSettings.outlineIntensity", {
		type: Number,
		default: 3,
	});
	addMenuSetting("core.menuSettings.position", {
		type: String,
		default: "start",
		choices: {
			start: t("core.menuSettings.position.top"),
			center: t("core.menuSettings.position.middle"),
			end: t("core.menuSettings.position.bottom"),
		},
		onChange: (value) => {
			game.healthEstimate.alignment = value;
		},
	});
	addMenuSetting("core.menuSettings.positionAdjustment", {
		type: Number,
		default: -1,
		onChange: (value) => {
			game.healthEstimate.margin = value;
		},
	});
	addMenuSetting("core.menuSettings.fontSize", {
		type: String,
		default: "x-large",
		onChange: (value) => {
			game.healthEstimate.fontSize = value;
		},
	});

	/* Storage for important variables. All following settings are set and read programmatically and do not have associated UI */
	/* Default for variables.colors are pre-calculated with chroma.scale(['#F00','#0F0']).mode('hsl').colors(100)                 */
	/* Default for variables.outline are pre-calculated by running chroma(color).darken(3) on each color in variables.colors   */
	addMenuSetting("core.variables.colors", {
		type: Array,
		default: [
			"#ff0000",
			"#ff0500",
			"#ff0a00",
			"#ff0f00",
			"#ff1500",
			"#ff1a00",
			"#ff1f00",
			"#ff2400",
			"#ff2900",
			"#ff2e00",
			"#ff3400",
			"#ff3900",
			"#ff3e00",
			"#ff4300",
			"#ff4800",
			"#ff4d00",
			"#ff5200",
			"#ff5800",
			"#ff5d00",
			"#ff6200",
			"#ff6700",
			"#ff6c00",
			"#ff7100",
			"#ff7600",
			"#ff7c00",
			"#ff8100",
			"#ff8600",
			"#ff8b00",
			"#ff9000",
			"#ff9500",
			"#ff9b00",
			"#ffa000",
			"#ffa500",
			"#ffaa00",
			"#ffaf00",
			"#ffb400",
			"#ffb900",
			"#ffbf00",
			"#ffc400",
			"#ffc900",
			"#ffce00",
			"#ffd300",
			"#ffd800",
			"#ffde00",
			"#ffe300",
			"#ffe800",
			"#ffed00",
			"#fff200",
			"#fff700",
			"#fffc00",
			"#fcff00",
			"#f7ff00",
			"#f2ff00",
			"#edff00",
			"#e8ff00",
			"#e3ff00",
			"#deff00",
			"#d8ff00",
			"#d3ff00",
			"#ceff00",
			"#c9ff00",
			"#c4ff00",
			"#bfff00",
			"#b9ff00",
			"#b4ff00",
			"#afff00",
			"#aaff00",
			"#a5ff00",
			"#a0ff00",
			"#9bff00",
			"#95ff00",
			"#90ff00",
			"#8bff00",
			"#86ff00",
			"#81ff00",
			"#7cff00",
			"#76ff00",
			"#71ff00",
			"#6cff00",
			"#67ff00",
			"#62ff00",
			"#5dff00",
			"#58ff00",
			"#52ff00",
			"#4dff00",
			"#48ff00",
			"#43ff00",
			"#3eff00",
			"#39ff00",
			"#34ff00",
			"#2eff00",
			"#29ff00",
			"#24ff00",
			"#1fff00",
			"#1aff00",
			"#15ff00",
			"#0fff00",
			"#0aff00",
			"#05ff00",
			"#00ff00",
		],
		onChange: (value) => {
			game.healthEstimate.colors = value;
		},
	});
	addMenuSetting("core.variables.outline", {
		type: Array,
		default: [
			"#5a0000",
			"#5a0000",
			"#5a0000",
			"#5a0000",
			"#5a0000",
			"#5a0000",
			"#5a0000",
			"#5a0000",
			"#5a0000",
			"#5a0000",
			"#5a0000",
			"#5a0000",
			"#5a0000",
			"#5a0000",
			"#5a0000",
			"#5a0000",
			"#5b0000",
			"#5b0000",
			"#5b0000",
			"#5b0000",
			"#5c0000",
			"#5c0000",
			"#5c0000",
			"#5d0000",
			"#5d0000",
			"#5e0000",
			"#5e0000",
			"#5e0000",
			"#5f0100",
			"#5f0a00",
			"#5f1400",
			"#601a00",
			"#601f00",
			"#602500",
			"#602900",
			"#612e00",
			"#613300",
			"#613800",
			"#613c00",
			"#614000",
			"#614500",
			"#614900",
			"#614d00",
			"#615200",
			"#615600",
			"#615a00",
			"#615e00",
			"#616300",
			"#606700",
			"#606b00",
			"#5d6d00",
			"#596d00",
			"#556d00",
			"#506d00",
			"#4c6d00",
			"#476d00",
			"#426c00",
			"#3c6c00",
			"#376c00",
			"#326c00",
			"#2c6c00",
			"#256b00",
			"#1e6b00",
			"#136b00",
			"#056b00",
			"#006a00",
			"#006a00",
			"#006a00",
			"#006a00",
			"#006a00",
			"#006900",
			"#006900",
			"#006900",
			"#006900",
			"#006800",
			"#006800",
			"#006800",
			"#006800",
			"#006800",
			"#006700",
			"#006700",
			"#006700",
			"#006700",
			"#006700",
			"#006700",
			"#006600",
			"#006600",
			"#006600",
			"#006600",
			"#006600",
			"#006600",
			"#006600",
			"#006600",
			"#006600",
			"#006600",
			"#006600",
			"#006600",
			"#006600",
			"#006600",
			"#006600",
		],
		onChange: (value) => {
			game.healthEstimate.outline = value;
		},
	});
	addMenuSetting("core.variables.deadColor", {
		type: String,
		default: "#990000",
		onChange: (value) => {
			game.healthEstimate.deadColor = value;
		},
	});
	addMenuSetting("core.variables.deadOutline", {
		type: String,
		default: "#340000",
		onChange: (value) => {
			game.healthEstimate.deadOutline = value;
		},
	});
};

/**
 * Handler called when token configuration window is opened. Injects custom form html and deals
 * with updating token.
 * @category GMOnly
 * @function
 * @async
 * @param {SettingsConfig} settingsConfig
 * @param {JQuery} html
 */
export async function renderSettingsConfigHandler(settingsConfig, html) {
	const outputChat = game.settings.get("healthEstimate", "core.outputChat");
	const outputChatCheckbox = html.find('input[name="healthEstimate.core.outputChat"]');
	const unknownEntityInput = html.find('input[name="healthEstimate.core.unknownEntity"]');
	disableCheckbox(unknownEntityInput, outputChat);

	outputChatCheckbox.on("change", (event) => {
		disableCheckbox(unknownEntityInput, event.target.checked);
	});

	if (game.settings.settings.has("healthEstimate.PF1.showExtra")) {
		const showExtra = game.settings.get("healthEstimate", "PF1.showExtra");
		const showExtraCheckbox = html.find('input[name="healthEstimate.PF1.showExtra"]');
		const disabledNameInput = html.find('input[name="healthEstimate.PF1.disabledName"]');
		const dyingNameInput = html.find('input[name="healthEstimate.PF1.dyingName"]');
		disableCheckbox(disabledNameInput, showExtra);
		disableCheckbox(dyingNameInput, showExtra);

		showExtraCheckbox.on("change", (event) => {
			disableCheckbox(disabledNameInput, event.target.checked);
			disableCheckbox(dyingNameInput, event.target.checked);
		});
	}
}

export async function renderHealthEstimateStyleSettingsHandler(settingsConfig, html) {
	const useColor = game.settings.get("healthEstimate", "core.menuSettings.useColor");
	const useColorCheckbox = html.find('input[name="useColor"]');
	const smoothGradientForm = html.find('input[name="smoothGradient"]').parent()[0];
	const gradientForm = html.find('div[class="form-group gradient"]')[0];
	const deadColorForm = html.find('input[name="deadColor"]').parent()[0];
	const sampleFrameHEForm = html.find('span[class="sampleFrameHE"]').parent()[0];

	function hideForm(form, boolean) {
		form.style.display = !boolean ? "none" : "flex";
	}

	hideForm(smoothGradientForm, useColor);
	hideForm(gradientForm, useColor);
	hideForm(deadColorForm, useColor);
	hideForm(sampleFrameHEForm, useColor);

	useColorCheckbox.on("change", (event) => {
		hideForm(smoothGradientForm, event.target.checked);
		hideForm(gradientForm, event.target.checked);
		hideForm(deadColorForm, event.target.checked);
		hideForm(sampleFrameHEForm, event.target.checked);
	});
}

export function disableCheckbox(checkbox, boolean) {
	checkbox.prop("disabled", !boolean);
}

/**
 * Handler called when token configuration window is opened. Injects custom form html and deals
 * with updating token.
 * @category GMOnly
 * @function
 * @async
 * @param {TokenConfig} tokenConfig
 * @param {JQuery} html
 */
export async function renderTokenConfigHandler(tokenConfig, html) {
	injectConfig.inject(
		tokenConfig,
		html,
		{
			moduleId: "healthEstimate",
			tab: {
				name: "healthEstimate",
				label: t("core.estimates.plural"),
				icon: "fas fa-scale-balanced",
			},
		},
		tokenConfig.object
	);
	const posTab = html.find('.tab[data-tab="healthEstimate"]');

	if (tokenConfig.options.sheetConfig) {
		var hideHealthEstimate = tokenConfig.object.getFlag("healthEstimate", "hideHealthEstimate") ? "checked" : "";
		var hideName = tokenConfig.object.getFlag("healthEstimate", "hideName") ? "checked" : "";
		var dontMarkDead = tokenConfig.object.getFlag("healthEstimate", "dontMarkDead") ? "checked" : "";
	} else {
		hideHealthEstimate = tokenConfig.token.flags?.healthEstimate?.hideHealthEstimate ? "checked" : "";
		hideName = tokenConfig.token.flags?.healthEstimate?.hideName ? "checked" : "";
		dontMarkDead = tokenConfig.token.flags?.healthEstimate?.dontMarkDead ? "checked" : "";
	}
	let data = {
		hideHealthEstimate: hideHealthEstimate,
		hideName: hideName,
		dontMarkDead: dontMarkDead,
		dontMarkDeadHint: f("core.keybinds.dontMarkDead.hint", { setting: t("core.NPCsJustDie.name") }),
		hideNameHint: f("core.keybinds.hideNames.hint", { setting: t("core.outputChat.name") }),
	};

	const insertHTML = await renderTemplate("modules/healthEstimate/templates/token-config.html", data);
	posTab.append(insertHTML);
}

export function onUpdateActor(actor, data, options, userId) {
	if (!game.user.isGM || !canvas.scene || !options?.diff) return;
	let tokens = canvas.tokens?.placeables.filter((e) => e.actor && e.actor.id == actor.id);
	for (let token of tokens) {
		if (token && !game.healthEstimate.breakOverlayRender(token) && !game.healthEstimate.hideEstimate(token) && token.id in game.healthEstimate.actorsCurrentHP) {
			outputStageChange(token);
		}
	}
}

// Starting in V11, this no longer works for changing a token's HP
export function onUpdateToken(token, change, options, userId) {
	if (!game.user.isGM || !canvas.scene) return;
	if (!game.healthEstimate.breakOverlayRender(token.object) && token.object.id in game.healthEstimate.actorsCurrentHP && !game.healthEstimate.hideEstimate(token.object)) {
		outputStageChange(token.object);
	}
}
