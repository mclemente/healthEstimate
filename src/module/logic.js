import * as providers from "./providers/_module.js";
import { providerKeys } from "./providers/_shared.js";
import { registerSettings } from "./settings.js";
import { addSetting, isEmpty, sGet, sSet } from "./utils.js";

export class HealthEstimate {
	constructor() {
		/** Changes which users get to see the overlay. */
		this.breakConditions = {
			default: "false",
		};
		this.actorsCurrentHP = {};
		this.lastZoom = null;
	}

	/**
	 * @type {Number}
	 */
	get gridScale() {
		return this.scaleToGridSize ? canvas.scene.dimensions.size / 100 : 1;
	}

	/**
	 * The module's Estimate Provider.
	 * @type {EstimationProvider}
	 */
	get provider() {
		return this.estimationProvider;
	}

	/**
	 * The Font Size scaled to the current grid scale and zoom level.
	 * Multiplies by 4 to increase the resolution.
	 * @type {Number}
	 */
	get scaledFontSize() {
		return ((this.fontSize * this.gridScale) / this.zoomLevel) * 4;
	}

	/**
	 * The current zoom level. If the Scale to Zoom setting is disabled, always returns 1.
	 * @type {Number}
	 */
	get zoomLevel() {
		return this.scaleToZoom ? Math.min(1, canvas.stage.scale.x) : 1;
	}

	// Hooks

	/**
	 * Sets the module's estimation provider, registers settings and updates break conditions.
	 */
	setup() {
		// Set the module's provider.
		const providerArray = Object.keys(providers);
		const supportedSystems = providerArray.join("|").replace(/EstimationProvider/g, "");
		const systemsRegex = new RegExp(supportedSystems);
		let providerString = "Generic";
		if (game.system.id in providerKeys) {
			providerString = providerKeys[game.system.id] || "Generic";
		} else if (systemsRegex.test(game.system.id)) {
			providerString = game.system.id;
		}

		/** @type {EstimateProvider} */
		this.estimationProvider = new providers[`${providerString}EstimationProvider`](`native.${providerString}`);

		if (this.estimationProvider.breakCondition !== undefined) {
			this.breakConditions.system = this.estimationProvider.breakCondition;
		}
		if (this.estimationProvider.tokenEffects !== undefined) {
			this.tokenEffectsPath = this.estimationProvider.tokenEffects;
		}
		registerSettings();
		for (let [key, data] of Object.entries(this.estimationProvider.settings)) {
			addSetting(key, data);
		}
		this.updateBreakConditions();
		this.updateSettings();
	}

	ready() {
		// Setting change handling
		if (!Number.isNumeric(this.fontSize)) {
			if (!isNaN(this.fontSize) && this.fontSize.match(/[0-9]*\.?[0-9]+(px|%)+/i)) {
				this.fontSize = Number(this.fontSize.replace(/(px|%)+/i, ""));
			} else {
				console.warn(
					`Health Estimate | ${game.i18n.format("healthEstimate.notifications.invalidFontSize", {
						fontSize: this.fontSize,
					})}`
				);
				this.fontSize = 24;
			}
			sSet("core.menuSettings.fontSize", this.fontSize || 24);
		}
		if (!Number.isNumeric(this.height)) {
			const heights = {
				top: "a",
				center: "b",
				end: "c",
			};
			this.position = heights[this.height];
			this.height = 0;
			sSet("core.menuSettings.position", 0);
			sSet("core.menuSettings.position2", this.position);
		}
	}

	/**
	 * @param {Token} token
	 * @param {Boolean} hovered
	 */
	_handleOverlay(token, hovered) {
		if (
			!token?.actor
			|| this.breakOverlayRender(token)
			|| (!game.user.isGM && this.hideEstimate(token))
			|| (!token.isVisible && !this.alwaysShow)
		) return;

		// Create PIXI
		try {
			if (hovered) {
				const { desc, color, stroke } = this.getEstimation(token);
				if (desc !== undefined && color && stroke) {
					const { width } = token.document.getSize();
					const y = -2 + this.height;
					const position = { a: 0, b: 1, c: 2 }[this.position];
					const x = (width / 2) * position;
					const config = { desc, color, stroke, width, x, y };
					if (!token.healthEstimate?._texture) {
						this._createHealthEstimate(token, config);
					} else this._updateHealthEstimate(token, config);
					if (game.Levels3DPreview?._active) {
						this._update3DHealthEstimate(token, config);
					}
				}
			} else if (token.healthEstimate) {
				token.healthEstimate.visible = false;
				if (game.Levels3DPreview?._active) {
					const { tokens } = game.Levels3DPreview;
					const token3d = tokens[token.id];
					if (token3d.healthEstimate) token3d.healthEstimate.visible = false;
				}
			}
		} catch(err) {
			console.error(
				`Health Estimate | Error on function _handleOverlay(). Token Name: "${token.name}". ID: "${token.id}". Type: "${token.document.actor.type}".`,
				err
			);
		}
	}

	/**
	 * @typedef {Object} TextStyle
	 * @property {Number} fontSize
	 * @property {String} fontFamily
	 * @property {String} fill
	 * @property {String} stroke
	 * @property {Number} strokeThickness
	 * @property {Number} padding
	 * @property {Boolean} dropShadow
	 * @property {String} dropShadowColor
	 * @property {String} lineJoin
	 */

	/**
	 * @typedef {Object} EstimateConfig
	 * @property {String} desc	The text to be displayed.
	 * @property {TextStyle} style	The styling rules to be drawn by PIXI.Text.
	 * @property {Number} x	The estimate's x position, based on the token's tooltip position and the module's setting.
	 * @property {Number} y The estimate's y position, based on the token's tooltip position and the module's setting.
	 */

	/**
	 * Creates an estimate as a PIXI.Text object and adds it to the token.
	 * @param {Token} token
	 * @param {EstimateConfig} config
	 */
	_createHealthEstimate(token, config = {}) {
		const { desc, color, stroke, width, x, y } = config;
		const style = this._getUserTextStyle(color, stroke);
		token.healthEstimate = token.addChild(new PIXI.Text(desc, style));
		token.healthEstimate.scale.set(0.25);
		token.healthEstimate.anchor.set(0.5, 1);
		token.healthEstimate.position.set(width / 2, x + y);
	}

	/**
	 * Updates an estimate's properties.
	 * @param {Token} token
	 * @param {EstimateConfig} config
	 */
	_updateHealthEstimate(token, config = {}) {
		const { desc, color, stroke, width, x, y } = config;
		token.healthEstimate.style.fontSize = this.scaledFontSize;
		token.healthEstimate.text = desc;
		token.healthEstimate.style.fill = color;
		token.healthEstimate.style.stroke = stroke;
		token.healthEstimate.visible = true;
		token.healthEstimate.position.set(width / 2, x + y);
	}

	/**
	 * Caches estimates for the 3D Canvas modules.
	 * @type {{SpriteMaterial}}
	 */
	_3DCache = {};

	/**
	 * Creates an estimate as a 3D object and adds it to the token3d.
	 * @param {Token} token
	 * @param {Object} config
	 */
	async _update3DHealthEstimate(token, config = {}) {
		const { tokens, THREE } = game.Levels3DPreview;
		const token3d = tokens[token.id];

		const spriteMaterial = await this._getThreeSpriteMaterial(config);
		const sprite = new THREE.Sprite(spriteMaterial);
		sprite.center.set(0.5, 0.5);

		token3d.mesh.remove(token3d.healthEstimate);
		token3d.healthEstimate = sprite;
		token3d.healthEstimate.userData.ignoreIntersect = true;
		token3d.healthEstimate.userData.ignoreHover = true;
		const width = spriteMaterial.pixiText.width / token3d.factor;
		const height = spriteMaterial.pixiText.height / token3d.factor;
		token3d.healthEstimate.scale.set(width, height, 1);
		token3d.healthEstimate.position.set(0, token3d.d + (height / 2) + 0.042, 0);
		token3d.mesh.add(token3d.healthEstimate);
	}

	/**
	 * Creates a Sprite based on a PIXI.Text.
	 * @param {Object} config
	 * @returns {SpriteMaterial}
	 */
	async _getThreeSpriteMaterial(config) {
		const { desc, color, stroke } = config;
		if (this._3DCache[desc + color + stroke]) return this._3DCache[desc + color + stroke];
		const { THREE } = game.Levels3DPreview;
		const style = this._getUserTextStyle(color, stroke);
		const text = new PIXI.Text(desc, style);
		const container = new PIXI.Container();
		container.addChild(text);
		const base64 = await canvas.app.renderer.extract.base64(container);
		const spriteMaterial = new THREE.SpriteMaterial({
			map: await new THREE.TextureLoader().loadAsync(base64),
			transparent: true,
			alphaTest: 0.1,
		});
		spriteMaterial.pixiText = text;
		this._3DCache[desc + color + stroke] = spriteMaterial;
		return spriteMaterial;
	}

	/**
	 * Creates a PIXI.TextStyle object.
	 * @param {String} color
	 * @param {String} stroke
	 * @returns {TextStyle}
	 */
	_getUserTextStyle(color, stroke) {
		const dropShadowColor = sGet("core.menuSettings.outline") === "brighten" ? "white" : "black";
		return {
			// Multiply font size to increase resolution quality
			fontSize: this.scaledFontSize,
			fontFamily: this.fontFamily,
			fill: color,
			stroke,
			strokeThickness: 12,
			padding: 5,
			dropShadow: true,
			dropShadowColor,
			lineJoin: "round",
		};
	}

	/**
	 * Returns an array of estimates related to the token.
	 * deepClone is used here because changes will reflect locally on the estimations setting (see {@link getEstimation})
	 * @param {TokenDocument} token
	 */
	getTokenEstimate(token) {
		let special;
		const validateEstimation = (iteration, token, estimation) => {
			const { name, rule } = estimation;
			try {
				const customLogic = this.estimationProvider.customLogic;
				const actor = token?.actor;
				const type = token.actor.type;
				const logic = `${customLogic}\nreturn ${rule}`;
				// eslint-disable-next-line no-new-func
				return new Function("actor", "token", "type", logic)(actor, token, type);
			} catch(err) {
				console.warn(
					`Health Estimate | Estimation Table "${name || iteration}" has an invalid JS Rule and has been skipped. ${err.name}: ${err.message}`
				);
				return false;
			}
		};

		for (const [iteration, estimation] of this.estimations.entries()) {
			if (estimation.rule === "default" || estimation.rule === "") continue;
			if (validateEstimation(iteration, token, estimation)) {
				if (estimation.ignoreColor) {
					special = estimation;
				} else {
					return {
						estimation: foundry.utils.deepClone(estimation),
						special: foundry.utils.deepClone(special)
					};
				}
			}
		}
		return { estimation: foundry.utils.deepClone(this.estimations[0]), special: foundry.utils.deepClone(special) };
	}

	/**
	 * Returns the token's estimate's description, color and stroke outline.
	 * @param {TokenDocument} token
	 * @returns {{desc: String, color: String, stroke: String}}
	 */
	getEstimation(token) {
		let desc = "";
		let color = "";
		let stroke = "";
		try {
			const fraction = Number(this.getFraction(token));
			const { estimate, index } = this.getStage(token, fraction);
			const isDead = this.isDead(token, estimate.value);

			const colorIndex = this.smoothGradient
				? Math.max(0, Math.ceil((this.colors.length - 1) * fraction))
				: index;
			estimate.label = isDead ? this.deathStateName : estimate.label;
			color = isDead ? this.deadColor : this.colors[colorIndex];
			stroke = isDead ? this.deadOutline : this.outline[colorIndex];
			desc = this.hideEstimate(token) ? `${estimate.label}*` : estimate.label;
			return { desc, color, stroke };
		} catch(err) {
			console.error(
				`Health Estimate | Error on getEstimation(). Token Name: "${token.name}". Type: "${token.document.actor.type}".`,
				err
			);
			return { desc, color, stroke };
		}
	}

	/**
	 * Returns the current health fraction of the token.
	 * @param {TokenDocument} token
	 * @returns {Number}
	 */
	getFraction(token) {
		const fraction = Math.max(0, Math.min(this.estimationProvider.fraction(token), 1));
		if (!Number.isNumeric(fraction)) {
			throw Error("Token's fraction is not valid, it probably doesn't have a numerical HP or Max HP value.");
		}
		return fraction;
	}

	/**
	 * @typedef {Object} Estimate
	 * @property {string} label
	 * @property {number} value
	 */

	/**
	 * Returns the estimate and its index.
	 * @param {TokenDocument} token
	 * @param {Number} fraction
	 * @returns {{estimate: Estimate, index: number}}
	 */
	getStage(token, fraction) {
		try {
			const { estimation, special } = this.getTokenEstimate(token);
			fraction *= 100;
			// for cases where 1% > fraction > 0%
			if (fraction !== 0 && Math.floor(fraction) === 0) fraction = 0.1;
			else fraction = Math.trunc(fraction);
			const logic = (e) => e.value >= fraction;
			const estimate = special
				? special.estimates.find(logic)
				: estimation.estimates.find(logic) ?? { value: fraction, label: "" };
			const index = estimation.estimates.findIndex(logic);
			return { estimate, index };
		} catch(err) {
			console.error(
				`Health Estimate | Error on getStage(). Token Name: "${token.name}". Type: "${token.document.actor.type}".`,
				err
			);
		}
	}

	// Utils

	/**
	 * Checks if a Token's or TokenDocument's estimate should be hidden.
	 * @param {Token|TokenDocument} token
	 * @returns {Boolean}
	 */
	hideEstimate(token) {
		return Boolean(
			token.document.getFlag("healthEstimate", "hideHealthEstimate")
				|| token.actor.getFlag("healthEstimate", "hideHealthEstimate")
		);
	}

	/**
	 * Checks if any combat, linked to the current scene or unlinked, is active.
	 * @returns {Boolean}
	 */
	isCombatRunning() {
		return [...game.combats].some(
			(combat) => combat.started && (combat._source.scene === canvas.scene._id || combat._source.scene == null)
		);
	}

	/**
	 * Returns if a token is dead.
	 * A token is dead if:
	 * (a) is a NPC at 0 HP and the NPCsJustDie setting is enabled
	 * (b) has been set as dead in combat (e.g. it has the skull icon, icon may vary from system to system) and the showDead setting is enabled
	 * (c) has the healthEstimate.dead flag, which is set by a macro.
	 * @param {Token} token
	 * @param {Integer} stage
	 * @returns {Boolean}
	 */
	isDead(token, stage) {
		const isOrganicType = this.estimationProvider.organicTypes.includes(token.actor.type);
		const isNPCJustDie =
			this.NPCsJustDie
			&& !token.actor.hasPlayerOwner
			&& stage === 0
			&& !token.document.getFlag("healthEstimate", "dontMarkDead");
		const isShowDead = this.showDead && this.tokenEffectsPath(token);
		const isDefeated = this.showDead && token.combatant?.defeated;
		const isFlaggedDead = token.document.getFlag("healthEstimate", "dead") || false;

		return isOrganicType && (isNPCJustDie || isShowDead || isDefeated || isFlaggedDead);
	}

	/**
	 * Checks if the estimate should be displayed based on the current conditions.
	 * @param {Boolean} hovered
	 * @returns {Boolean}
	 */
	showCondition(hovered) {
		const combatTrigger = this.combatOnly && this.combatRunning;
		return (
			(this.alwaysShow && (combatTrigger || !this.combatOnly)) || (hovered && (combatTrigger || !this.combatOnly))
		);
	}

	/**
	 * Path of the token's effects. Useful for systems that change how it is handled (e.g. PF2e, DSA5, SWADE).
	 * @returns {Boolean}
	 */
	tokenEffectsPath(token) {
		const deadIcon = this.estimationProvider.deathMarker.config
			? this.deathMarker
			: CONFIG.statusEffects.find((x) => x.id === "dead")?.img ?? this.deathMarker;
		return Array.from(token.actor.effects.values()).some((x) => x.img === deadIcon);
	}

	/**
	 * Updates the Break Conditions and the Overlay Render's Break Condition method.
	 * @returns {Boolean}
	 */
	updateBreakConditions() {
		this.breakConditions.onlyGM = sGet("core.showDescription") === 1 ? "|| !game.user.isGM" : "";
		this.breakConditions.onlyNotGM = sGet("core.showDescription") === 2 ? "|| game.user.isGM" : "";
		this.breakConditions.onlyPCs =
			sGet("core.showDescriptionTokenType") === 1 ? "|| !token.actor?.hasPlayerOwner" : "";
		this.breakConditions.onlyNPCs =
			sGet("core.showDescriptionTokenType") === 2 ? "|| token.actor?.hasPlayerOwner" : "";

		const prep = (key) => (isEmpty(this.breakConditions[key]) ? "" : this.breakConditions[key]);

		this.breakOverlayRender = (token) => {
			try {
				// eslint-disable-next-line no-new-func
				return new Function(
					"token",
					`return (
						${prep("default")}
						${prep("onlyGM")}
						${prep("onlyNotGM")}
						${prep("onlyNPCs")}
						${prep("onlyPCs")}
						${prep("system")}
					)`
				)(token);
			} catch(err) {
				if (err.name === "TypeError") {
					console.warn(
						`Health Estimate | Error on breakOverlayRender(), skipping. Token Name: "${token.name}". Type: "${token.document.actor.type}".`,
						err
					);
					return true;
				}
				console.error(err);
			}
		};
	}

	/**
	 * Variables for settings to avoid multiple system calls for them, since the estimate can be called really often.
	 * Updates the variables if any setting was changed.
	 */
	updateSettings() {
		this.descriptions = sGet("core.stateNames").split(/[,;]\s*/);
		this.estimations = sGet("core.estimations");
		this.deathStateName = sGet("core.deathStateName");
		this.showDead = sGet("core.deathState");
		this.NPCsJustDie = sGet("core.NPCsJustDie");
		this.deathMarker = sGet("core.deathMarker");
		this.scaleToGridSize = sGet("core.menuSettings.scaleToGridSize");
		this.scaleToZoom = sGet("core.menuSettings.scaleToZoom");
		this.outputChat = sGet("core.outputChat");

		this.smoothGradient = sGet("core.menuSettings.smoothGradient");

		this.height = sGet("core.menuSettings.position");
		this.position = sGet("core.menuSettings.position2");
		this.fontFamily = sGet("core.menuSettings.fontFamily");
		this.fontSize = sGet("core.menuSettings.fontSize");

		this.colors = sGet("core.variables.colors");
		this.outline = sGet("core.variables.outline");
		this.deadColor = sGet("core.variables.deadColor");
		this.deadOutline = sGet("core.variables.deadOutline");

		this.tooltipPosition = game.modules.get("elevation-module")?.active ? null : sGet("core.tooltipPosition");
	}
}
