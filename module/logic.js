import { registerSettings } from "./settings.js";
import { fractionFormula, prepareSystemSpecifics, tokenEffectsPath, updateBreakSettings } from "./systemSpecifics.js";
import { sGet, t } from "./utils.js";

let alignment, colors, deadColor, deadOutline, NPCsJustDie, outline, margin, perfectionism, showDead;

export class HealthEstimate {
	constructor() {}

	setup() {
		prepareSystemSpecifics().then(registerSettings());
		updateBreakSettings();
		this.updateSettings();
	}

	/**
	 * Sets all the hooks related to a game with a canvas enabled.
	 */
	canvasReady() {
		this.actorsCurrentHP = {};
		const alwaysShow = sGet("core.alwaysShow");
		Hooks.on("refreshToken", (token) => {
			this._handleOverlay(token, alwaysShow || token.hover);
		});
		Hooks.on("hoverToken", (token, hovered) => {
			this._handleOverlay(token, alwaysShow || hovered);
		});
		if (alwaysShow) canvas.scene.tokens.forEach((token) => token.object.refresh());
		Hooks.on("updateActor", (actor, data, options, userId) => {
			if (alwaysShow) {
				//Get all the tokens on the off-chance there's two tokens of the same linked actor.
				let tokens = canvas.tokens.placeables.filter((e) => e.actor && actor.id == e.actor.id);
				for (let token of tokens) {
					this._handleOverlay(token, true);
				}
			}
		});
		Hooks.on("updateToken", (token, change, options, userId) => {
			if (alwaysShow) this._handleOverlay(token, true);
		});
	}

	_handleOverlay(token, hovered) {
		if (!token?.actor) return;
		if (game.healthEstimate.breakOverlayRender(token) || (!game.user.isGM && this.hideEstimate(token))) return;
		const width = canvas.scene.grid.size * token.document.width;
		document.documentElement.style.setProperty("--healthEstimate-width", `${width}px`);

		if (hovered) {
			if (!token.isVisible) return;
			const { desc, color, stroke } = this.getEstimation(token);
			if (!desc) return;
			if (token.healthEstimate) token.healthEstimate.destroy();
			token.healthEstimate = token.addChild(
				new PIXI.Text(desc, {
					fontSize: document.documentElement.style.getPropertyValue("--healthEstimate-text-size"),
					fill: color,
					stroke: stroke,
					strokeThickness: 3,
				})
			);

			const gridSize = canvas.scene.grid.size;
			const tokenHeight = token.document.height;
			token.healthEstimate.anchor.x = 0.5;
			token.healthEstimate.anchor.y = margin;
			token.healthEstimate.x = Math.floor(width / 2);
			switch (alignment) {
				case "start":
					token.healthEstimate.y = -Math.floor((gridSize / 2) * tokenHeight);
					break;
				case "center":
					break;
				case "end":
					token.healthEstimate.y = Math.floor((gridSize * tokenHeight) / 2);
					break;
				default:
					console.error("Alignment isn't supposed to be of value %o", alignment);
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
	 * @returns {Object}	All three values are Strings.
	 */
	getEstimation(token) {
		try {
			const fraction = this.getFraction(token);
			if (perfectionism == 2 && fraction == 1) return;
			let customStages = token.document.getFlag("healthEstimate", "customStages") || token.actor.getFlag("healthEstimate", "customStages") || "";
			if (customStages.length) customStages = customStages.split(/[,;]\s*/);
			const stage = this.getStage(fraction, customStages || []);
			const colorIndex = Math.max(0, Math.ceil((colors.length - 1) * fraction));

			let dead = this.isDead(token, stage);
			let desc = this.descriptionToShow(
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
			let color = colors[colorIndex];
			let stroke = outline[colorIndex];
			if (dead) {
				color = deadColor;
				stroke = deadOutline;
			}
			document.documentElement.style.setProperty("--healthEstimate-stroke-color", stroke);
			document.documentElement.style.setProperty("--healthEstimate-text-color", color);
			if (this.hideEstimate(token)) desc += "*";
			return { desc, color, stroke };
			// canvas.hud.HealthEstimate.estimation = { desc };
		} catch (err) {
			console.error(`Health Estimate | Error on getEstimation(). Token Name: %o. Type: %o`, token.name, token.document.actor.type, err);
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
		return Math.max(0, perfectionism ? Math.ceil((desc.length - 2 + Math.floor(fraction)) * fraction) : Math.ceil((desc.length - 1) * fraction));
	}
	hideEstimate(token) {
		return token.document.getFlag("healthEstimate", "hideHealthEstimate") || token.actor.getFlag("healthEstimate", "hideHealthEstimate");
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
			(NPCsJustDie && !token.actor.hasPlayerOwner && stage === 0 && !token.document.getFlag("healthEstimate", "treatAsPC")) ||
			(showDead && tokenEffectsPath(token)) ||
			token.document.getFlag("healthEstimate", "dead") ||
			false
		);
	}

	/**
	 * Variables for settings to avoid multiple system calls for them, since the estimate can be called really often.
	 * Updates the variables if any setting was changed.
	 */
	updateSettings() {
		this.descriptions = sGet("core.stateNames").split(/[,;]\s*/);
		this.deathStateName = sGet("core.deathStateName");
		showDead = sGet("core.deathState");
		NPCsJustDie = sGet("core.NPCsJustDie");
		this.deathMarker = sGet("core.deathMarker");
		colors = sGet("core.variables.colors");
		outline = sGet("core.variables.outline");
		deadColor = sGet("core.variables.deadColor");
		deadOutline = sGet("core.variables.deadOutline");
		perfectionism = sGet("core.perfectionism");

		alignment = sGet("core.menuSettings.position");
		margin = sGet("core.menuSettings.positionAdjustment");
		document.documentElement.style.setProperty("--healthEstimate-alignment", alignment);
		document.documentElement.style.setProperty("--healthEstimate-margin", `${margin}em`);
		document.documentElement.style.setProperty("--healthEstimate-text-size", sGet("core.menuSettings.fontSize"));
	}
}
