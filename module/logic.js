import { registerSettings } from "./settings.js";
import { fractionFormula, prepareSystemSpecifics, tokenEffectsPath, updateBreakSettings } from "./systemSpecifics.js";
import { sGet, t } from "./utils.js";

export class HealthEstimate {
	constructor() {}

	//Hooks
	setup() {
		prepareSystemSpecifics().then(registerSettings());
		updateBreakSettings();
		this.updateSettings();
	}

	canvasInit(canvas) {
		this.combatRunning = this.isCombatRunning();
	}

	/**
	 * Sets all the hooks related to a game with a canvas enabled.
	 */
	canvasReady() {
		this.actorsCurrentHP = {};
		this.combatOnly = sGet("core.combatOnly");
		if (this.combatOnly) this.combatHooks(this.combatOnly);
		this.alwaysShow = sGet("core.alwaysShow");
		this.combatRunning = this.isCombatRunning();
		Hooks.on("refreshToken", (token) => {
			this._handleOverlay(token, this.showCondition(token.hover));
		});
		Hooks.on("hoverToken", (token, hovered) => {
			this._handleOverlay(token, this.showCondition(hovered));
		});
		if (this.alwaysShow) canvas.scene.tokens.forEach((token) => token.object.refresh());
		Hooks.on("updateActor", (actor, updates, options, userId) => {
			if (this.alwaysShow) {
				//Get all the tokens on the off-chance there's two tokens of the same linked actor.
				let tokens = canvas.tokens.placeables.filter((e) => e.actor && actor.id == e.actor.id);
				for (let token of tokens) {
					this._handleOverlay(token, true);
				}
			}
		});
		Hooks.on("updateToken", (tokenDocument, updates, options, userId) => {
			if (this.alwaysShow) this._handleOverlay(tokenDocument.object, true);
		});
		Hooks.on("canvasInit", this.canvasInit.bind(this));
	}

	//combatStart, deleteCombat and combatHooks target the global Health Estimate object because Hooks.off doesn't interact correctly with "this.funcion.bind(this)"
	combatStart(combat, updateData) {
		game.healthEstimate.combatRunning = true;
	}

	deleteCombat(combat, options, userId) {
		game.healthEstimate.combatRunning = game.healthEstimate.isCombatRunning();
	}

	combatHooks(value) {
		if (value) {
			Hooks.on("combatStart", game.healthEstimate.combatStart);
			Hooks.on("deleteCombat", game.healthEstimate.deleteCombat);
		} else {
			Hooks.off("combatStart", game.healthEstimate.combatStart);
			Hooks.off("deleteCombat", game.healthEstimate.deleteCombat);
		}
	}

	//Helpers
	_handleOverlay(token, hovered) {
		if (!token?.actor) return;
		if (game.healthEstimate.breakOverlayRender(token) || (!game.user.isGM && this.hideEstimate(token))) return;

		if (hovered) {
			if (!token.isVisible) return;
			const { desc, color, stroke } = this.getEstimation(token);
			if (!desc) return;
			if (token.healthEstimate?._texture) token.healthEstimate.destroy();

			const zoomLevel = Math.min(1, canvas.stage.scale.x);
			let fontSize = this.fontSize;
			if (this.scaleToZoom && zoomLevel < 1) {
				if (isNaN(Number(fontSize.replace("px", "")))) {
					const cssValues = {
						"x-small": 10,
						small: 13,
						medium: 16,
						large: 18,
						"x-large": 24,
					};
					fontSize = cssValues[fontSize] || 24;
				} else fontSize = fontSize.replace("px", "");
				fontSize = `${24 * (1 / zoomLevel)}px`;
			}

			const userTextStyle = {
				fontSize: fontSize,
				fontFamily: CONFIG.canvasTextStyle.fontFamily,
				fill: color,
				stroke: stroke,
				strokeThickness: 3,
				padding: 5,
			};
			token.healthEstimate = token.addChild(new PIXI.Text(desc, userTextStyle));

			token.healthEstimate.anchor.x = 0.5;
			if (!this.scaleToZoom || (this.scaleToZoom && zoomLevel >= 1)) {
				token.healthEstimate.anchor.y = this.margin;
			}
			const gridSize = canvas.scene.grid.size;
			const width = gridSize * token.document.width;
			const height = gridSize * token.document.height;
			token.healthEstimate.x = Math.floor(width / 2);
			switch (this.alignment) {
				case "start":
					token.healthEstimate.y = -50;
					break;
				case "center":
					break;
				case "end":
					token.healthEstimate.y = height;
					break;
				default:
					console.error(`Health Estimate | Style Setting: Position isn't supposed to be of value "${this.alignment}".`);
			}
		} else if (token.healthEstimate) token.healthEstimate.visible = false;
	}

	/**
	 * Function handling which description to show. Can be overriden by a system-specific implementation
	 * @param {String[]} descriptions
	 * @param {Number} stage
	 * @param {Token} token
	 * @param {object} state
	 * @param {Number} fraction
	 * @returns {String}
	 */
	descriptionToShow(descriptions, stage, token, state = { dead: false, desc: "" }, fraction) {
		if (state.dead) {
			return state.desc;
		}
		return descriptions[stage];
	}

	/**
	 * Returns the token's estimate's description, color and stroke outline.
	 * @param {TokenDocument} token
	 * @returns {{String, String, String}}	All three values are Strings.
	 */
	getEstimation(token) {
		try {
			let desc = "",
				color = "",
				stroke = "";
			const fraction = this.getFraction(token);
			if (!(this.perfectionism == 2 && fraction == 1)) {
				let customStages = token.document.getFlag("healthEstimate", "customStages") || token.actor.getFlag("healthEstimate", "customStages") || "";
				if (customStages.length) customStages = customStages.split(/[,;]\s*/);
				const stage = this.getStage(fraction, customStages || []);

				let dead = this.isDead(token, stage);
				desc = this.descriptionToShow(
					customStages.length ? customStages : this.descriptions,
					stage,
					token,
					{
						dead: dead,
						desc: this.deathStateName,
					},
					fraction,
					customStages.length ? true : false
				);
				if (this.smoothGradient) var colorIndex = Math.max(0, Math.ceil((this.colors.length - 1) * fraction));
				else if (this.perfectionism) colorIndex = stage;
				else colorIndex = Math.max(0, Math.floor((this.colors.length - 1) * fraction));
				color = this.colors[colorIndex];
				stroke = this.outline[colorIndex];
				if (dead) {
					color = this.deadColor;
					stroke = this.deadOutline;
				}
				if (this.hideEstimate(token)) desc += "*";
			}
			return { desc, color, stroke };
		} catch (err) {
			console.error(`Health Estimate | Error on getEstimation(). Token Name: "${token.name}". Type: "${token.document.actor.type}".`, err);
		}
	}

	/**
	 * Returns the current health fraction of the token.
	 * @param {TokenDocument} token
	 * @returns {Number}
	 */
	getFraction(token) {
		return Math.min(fractionFormula(token), 1);
	}

	/**
	 * Returns the current health stage of the token.
	 * @param {Number} fraction
	 * @returns {Number}
	 */
	getStage(fraction, customStages = []) {
		const desc = customStages?.length ? customStages : this.descriptions;
		return Math.max(0, this.perfectionism ? Math.ceil((desc.length - 2 + Math.floor(fraction)) * fraction) : Math.ceil((desc.length - 1) * fraction));
	}

	hideEstimate(token) {
		return token.document.getFlag("healthEstimate", "hideHealthEstimate") || token.actor.getFlag("healthEstimate", "hideHealthEstimate");
	}

	isCombatRunning() {
		return [...game.combats].some((combat) => combat.started);
	}

	/**
	 * Returns if a token is dead.
	 * A token is dead if:
	 * (a) is a NPC at 0 HP and the NPCsJustDie setting is enabled
	 * (b) has been set as dead in combat (e.g. it has the skull icon, icon may vary from system to system) and the showDead setting is enabled
	 * (c) has the healthEstimate.dead flag, which is set by a macro.
	 * @param {TokenDocument} token
	 * @param {Integer} stage
	 * @returns {Boolean}
	 */
	isDead(token, stage) {
		return (
			(this.NPCsJustDie && !token.actor.hasPlayerOwner && stage === 0 && !token.document.getFlag("healthEstimate", "treatAsPC")) ||
			(this.showDead && tokenEffectsPath(token)) ||
			token.document.getFlag("healthEstimate", "dead") ||
			false
		);
	}

	showCondition(hovered) {
		const combatTrigger = this.combatOnly && this.combatRunning;
		return (this.alwaysShow && combatTrigger) || (this.alwaysShow && !this.combatOnly) || (hovered && combatTrigger) || (hovered && !this.combatOnly);
	}

	/**
	 * Variables for settings to avoid multiple system calls for them, since the estimate can be called really often.
	 * Updates the variables if any setting was changed.
	 */
	updateSettings() {
		this.descriptions = sGet("core.stateNames").split(/[,;]\s*/);
		this.deathStateName = sGet("core.deathStateName");
		this.showDead = sGet("core.deathState");
		this.NPCsJustDie = sGet("core.NPCsJustDie");
		this.deathMarker = sGet("core.deathMarker");
		this.perfectionism = sGet("core.perfectionism");
		this.scaleToZoom = sGet("core.menuSettings.scaleToZoom");

		this.smoothGradient = sGet("core.menuSettings.smoothGradient");

		this.alignment = sGet("core.menuSettings.position");
		this.margin = sGet("core.menuSettings.positionAdjustment");
		this.fontSize = sGet("core.menuSettings.fontSize");

		this.colors = sGet("core.variables.colors");
		this.outline = sGet("core.variables.outline");
		this.deadColor = sGet("core.variables.deadColor");
		this.deadOutline = sGet("core.variables.deadOutline");
	}
}
