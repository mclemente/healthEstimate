import * as forms from "./forms/_module.js";
import { HealthEstimateHooks } from "./hooks.js";
import { addMenuSetting, addSetting, f, repositionTooltip, t } from "./utils.js";

const { ArrayField, BooleanField, NumberField, SchemaField, StringField } = foundry.data.fields;

export const registerSettings = function () {
	game.settings.registerMenu("healthEstimate", "behaviorSettings", {
		name: t("core.menuSettings.behaviorSettings.plural"),
		label: t("core.menuSettings.behaviorSettings.plural"),
		icon: "fas fa-gear",
		type: forms.BehaviorSettings,
		restricted: true,
	});
	game.settings.registerMenu("healthEstimate", "estimationSettings", {
		name: t("core.estimationSettings.title"),
		label: t("core.estimationSettings.title"),
		icon: "fas fa-scale-balanced",
		type: forms.EstimationSettings,
		restricted: true,
	});
	game.settings.registerMenu("healthEstimate", "styleSettings", {
		name: t("core.menuSettings.styleSettings.plural"),
		label: t("core.menuSettings.styleSettings.plural"),
		icon: "fas fa-palette",
		type: forms.StyleSettings,
		restricted: true,
	});

	/* Settings for the main settings menu */
	addSetting("core.alwaysShow", {
		name: "healthEstimate.core.alwaysShow.name",
		hint: "healthEstimate.core.alwaysShow.hint",
		scope: "user",
		type: Boolean,
		default: false,
		onChange: (value) => {
			game.healthEstimate.alwaysShow = value;
			canvas.tokens?.placeables.forEach((token) =>
				game.healthEstimate._handleOverlay(token, value || game.healthEstimate.showCondition(token.hover))
			);
		},
	});
	addSetting("core.stateNames", {
		type: String,
		default: "",
		config: false,
	});
	addMenuSetting("core.estimations", {
		type: new ArrayField(
			new SchemaField({
				name: new StringField({ label: "Name", localize: true }),
				ignoreColor: new BooleanField({
					label: "healthEstimate.core.estimationSettings.ignoreColor.name",
					hint: "healthEstimate.core.estimationSettings.ignoreColor.hint",
					localize: true
				}),
				rule: new StringField({ initial: "", label: "healthEstimate.core.estimationSettings.jsRule", localize: true }),
				estimates: new ArrayField(
					new SchemaField({
						value: new NumberField({ required: true, min: 0, max: 100, nullable: false }),
						label: new StringField({ required: true })
					})
				)
			}),
			{
				empty: false,
				initial: game.healthEstimate.estimationProvider.estimations
			}
		),
		onChange: (value) => {
			game.healthEstimate.estimations = value;
			canvas.scene?.tokens.forEach((token) => token.object.refresh());
		},
	});
	addSetting("core.tooltipPosition", {
		config: !game.modules.get("elevation-module")?.active,
		type: String,
		default: "default",
		choices: {
			left: "healthEstimate.core.tooltipPosition.options.left",
			default: "healthEstimate.core.tooltipPosition.options.default",
			right: "healthEstimate.core.tooltipPosition.options.right",
		},
		onChange: (value) => {
			game.healthEstimate.tooltipPosition = value;
			canvas.tokens?.placeables.forEach((token) => repositionTooltip(token, true));
		},
	});

	addSetting("core.outputChat", {
		hint: f("core.outputChat.hint", { setting: t("core.unknownEntity.name") }),
		type: Boolean,
		default: false,
		onChange: (value) => {
			game.healthEstimate.outputChat = value;
		},
	});
	let warning = " ";
	if (game.modules.get("combat-utility-belt")?.active) warning += t("core.unknownEntity.warningCUB");
	else if (game.modules.get("xdy-pf2e-workbench")?.active) warning += t("core.unknownEntity.warningPF2eWorkbench");
	addSetting("core.unknownEntity", {
		type: String,
		hint: f("core.unknownEntity.hint", { warning }),
		default: game.i18n.localize("healthEstimate.core.unknownEntity.default"),
	});
	addSetting("core.addTemp", {
		config: game.healthEstimate.estimationProvider.addTemp,
		type: Boolean,
		default: false,
	});
	addSetting("core.breakOnZeroMaxHP", {
		config: game.healthEstimate.estimationProvider.breakOnZeroMaxHP,
		type: new StringField({
			required: true, nullable: false, blank: false, initial: "none", choices: {
				none: "healthEstimate.core.breakOnZeroMaxHP.options.none",
				zero: "healthEstimate.core.breakOnZeroMaxHP.options.zero",
				one: "healthEstimate.core.breakOnZeroMaxHP.options.one",
				zeroOrOne: "healthEstimate.core.breakOnZeroMaxHP.options.zeroOrOne"
			}}),
		onChange: () => {
			game.healthEstimate.updateBreakConditions();
		}
	});
	addSetting("core.hideVehicleHP", {
		name: "healthEstimate.PF2E.hideVehicleHP.name",
		hint: "healthEstimate.PF2E.hideVehicleHP.hint",
		config: game.healthEstimate.estimationProvider.vehicleRules.config,
		type: Boolean,
		default: false,
	});

	/* Settings for the behavior menu */
	addMenuSetting("core.combatOnly", {
		type: Boolean,
		default: false,
		onChange: (value) => {
			game.healthEstimate.combatOnly = value;
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
		hint: game.healthEstimate.estimationProvider.deathMarker.config
			? f("core.deathState.hint1", {
				setting: t("core.deathStateName.name"),
				setting2: t("core.deathMarker.name"),
			})
			: f("core.deathState.hint2", { setting: t("core.deathStateName.name") }),
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
		default: game.healthEstimate.estimationProvider.deathMarker.default,
		onChange: (value) => {
			game.healthEstimate.deathMarker = value;
		},
	});

	/* Settings for the custom menu */
	addMenuSetting("core.menuSettings.useColor", {
		type: Boolean,
		default: true,
	});
	addMenuSetting("core.menuSettings.scaleToGridSize", {
		type: Boolean,
		default: false,
		onChange: (value) => {
			game.healthEstimate.scaleToGridSize = value;
		},
	});
	addMenuSetting("core.menuSettings.scaleToZoom", {
		type: Boolean,
		default: false,
		onChange: (value) => {
			game.healthEstimate.scaleToZoom = value;
			if (value) Hooks.on("canvasPan", HealthEstimateHooks.onCanvasPan);
			else Hooks.off("canvasPan", HealthEstimateHooks.onCanvasPan);
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
			colors: ["#FF0000", "#00FF00"],
			positions: [0, 1],
		},
	});
	addMenuSetting("core.menuSettings.mode", {
		type: String,
		default: "hsl",
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
		onChange: (s) => {
			const color = s === "darken" ? "black" : "white";
			canvas.tokens?.placeables
				.filter((token) => game.healthEstimate._cache[token.id])
				.forEach((token) => (game.healthEstimate._cache[token.id].style.dropShadowColor = color));
		},
	});
	addMenuSetting("core.menuSettings.outlineIntensity", {
		type: Number,
		default: 3,
	});
	addMenuSetting("core.menuSettings.position2", {
		type: String,
		default: "a",
		choices: {
			a: t("core.menuSettings.position.top"),
			b: t("core.menuSettings.position.middle"),
			c: t("core.menuSettings.position.bottom"),
		},
		onChange: (value) => {
			game.healthEstimate.position = value;
		},
	});
	addMenuSetting("core.menuSettings.position", {
		type: Number,
		default: 0,
		onChange: (value) => {
			game.healthEstimate.height = value;
		},
	});

	const getFonts = () => {
		const fontSources = {
			...CONFIG.fontDefinitions,
			...game.settings.get("core", "fonts"),
		};
		const fonts = Object.keys(fontSources).reduce((acc, font) => {
			acc[font] = font;
			return acc;
		}, {});

		const defaultFont = CONFIG.canvasTextStyle.fontFamily;
		if (!(defaultFont in fonts)) {
			fonts[defaultFont] = defaultFont;
		}

		return fonts;
	};
	addMenuSetting("core.menuSettings.fontFamily", {
		name: game.i18n.localize("EDITOR.Font"),
		type: String,
		default: CONFIG.canvasTextStyle.fontFamily,
		choices: getFonts(),
		onChange: (value) => {
			game.healthEstimate.fontFamily = value;
			canvas.scene?.tokens.forEach((token) => {
				if (token.object.healthEstimate) {
					token.object.healthEstimate.style.fontFamily = value;
				}
			});
		},
	});
	addMenuSetting("core.menuSettings.fontSize", {
		type: Number,
		default: 24,
		onChange: (value) => {
			game.healthEstimate.fontSize = value;
			canvas.scene?.tokens.forEach((token) => {
				if (token.object.healthEstimate) {
					token.object.healthEstimate.style.fontSize = game.healthEstimate.scaledFontSize;
				}
			});
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
