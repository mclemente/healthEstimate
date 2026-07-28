import { addCharacter, outputStageChange } from "./HealthMonitor.js";
import * as providers from "./providers/_module.js";
import { providerKeys } from "./providers/_shared.js";
import { registerSettings } from "./settings.js";
import { addSetting, disableCheckbox, f, isEmpty, repositionTooltip, sGet, t } from "./utils.js";

export class HealthEstimate {
	constructor() {
		game.healthEstimate = this;
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
		registerSettings();

		this.breakConditions.system = this.estimationProvider.breakCondition;
		if (this.estimationProvider.tokenEffects !== undefined) {
			this.tokenEffectsPath = this.estimationProvider.tokenEffects;
		}
		for (let [key, data] of Object.entries(this.estimationProvider.settings)) {
			addSetting(key, data);
		}
		this.updateBreakConditions();
		this.updateSettings();

		// Canvas
		Hooks.on("canvasInit", () => this.lastZoom = null);
		Hooks.once("canvasReady", HealthEstimate.onceCanvasReady.bind(this));
		Hooks.on("combatStart", HealthEstimate.onCombatStart.bind(this));
		Hooks.on("updateCombat", HealthEstimate.onUpdateCombat.bind(this));
		Hooks.on("deleteCombat", HealthEstimate.onUpdateCombat.bind(this));
		const onCanvasReady = HealthEstimate.onCanvasReady.bind(this);
		Hooks.on("canvasReady", onCanvasReady);
		Hooks.on("3DCanvasSceneReady", () => setTimeout(onCanvasReady, 10));
		Hooks.on("createToken", HealthEstimate.onCreateToken.bind(this));

		// Actor
		Hooks.on("updateActor", HealthEstimate.onUpdateActor.bind(this));
		Hooks.on("deleteActor", HealthEstimate.deleteActor);
		Hooks.on("deleteToken", HealthEstimate.deleteToken.bind(this));
		Hooks.on("deleteActiveEffect", HealthEstimate.deleteActiveEffect.bind(this));

		// Rendering
		Hooks.on("renderChatMessage", HealthEstimate.onRenderChatMessage);
		Hooks.on("renderSettingsConfig", HealthEstimate.renderSettingsConfigHandler);
		Hooks.on(
			"renderPrototypeTokenConfig",
			(_app, form, data, options) => HealthEstimate.renderTokenConfigHandler(form, data, options, "source")
		);
		Hooks.on(
			"renderTokenConfig",
			(_app, form, data, options) => HealthEstimate.renderTokenConfigHandler(form, data, options)
		);
	}

	/**
	 * Caches estimates.
	 * @type {{PIXI.Text}}
	 */
	_cache = {};

	/**
	 * Caches estimates for the 3D Canvas modules.
	 * @type {{SpriteMaterial}}
	 */
	_3DCache = {};

	breakConditions = {};

	/**
	 * @typedef {Object} ActorHP
	 * @property {string} name              Name used for Health Monitor's outputStageChange.
	 * @property {{estimate: string, index: number}} stage Estimate's label and index.
	 * @property {boolean} dead             Whether the actor is dead.
	 */

	/**
	 * Current HP estimation for each actor, keyed by actor ID.
	 *
	 * @type {Object<string, ActorHP>}
	 */
	actorsCurrentHP = {};

	/**
	 * @type {Number}
	 */
	get gridScale() {
		// TODO replace 100 with a Grid Scale Number setting
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

	/**
	 * @param {Token} token
	 * @param {Boolean} hovered
	 */
	_handleOverlay(token, hovered) {
		if (
			!token?.actor
			|| this.breakOverlayRender(token)
			|| (!game.user.isGM && this.hideEstimate(token))
		) return;

		// Create PIXI
		try {
			const estimate = this._cache[token.id];
			const displayEstimate = token.isVisible && !token.document.isSecret && hovered;
			if (displayEstimate) {
				const { desc, color, stroke } = this.getEstimation(token);
				if (desc !== undefined && color && stroke) {
					const { width } = token.document.getSize();
					const y = -2 + this.height;
					const position = { a: 0, b: 1, c: 2 }[this.position];
					const x = (width / 2) * position;
					const config = { desc, color, stroke, width, x, y };
					if (!estimate?._texture) {
						this._createHealthEstimate(token, config);
					} else this._updateHealthEstimate(token, config);
					if (game.Levels3DPreview?._active) {
						this._update3DHealthEstimate(token, config);
					}
				}
			} else if (estimate) {
				estimate.visible = false;
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
		const scale = this.scaleToTokenSize ? token.document.width : 1;
		const { desc, color, stroke, width, x, y } = config;
		const style = this._getUserTextStyle(color, stroke);
		const estimate = canvas.interface.healthEstimate.addChild(new PIXI.Text(desc, style));
		this._cache[token.id] = estimate;
		token.healthEstimate = estimate;
		estimate.alpha = token.mesh.alpha;
		estimate.scale.set(scale * 0.25);
		estimate.anchor.set(0.5, 1);
		estimate.position.set(token.x + (width / 2), token.y + x + y);
	}

	/**
	 * Updates an estimate's properties.
	 * @param {Token} token
	 * @param {EstimateConfig} config
	 */
	_updateHealthEstimate(token, config = {}) {
		const scale = this.scaleToTokenSize ? token.document.width : 1;
		const { desc, color, stroke, width, x, y } = config;
		const estimate = this._cache[token.id];
		estimate.style.fontSize = this.scaledFontSize;
		estimate.text = desc;
		estimate.style.fill = color;
		estimate.style.stroke = stroke;
		estimate.visible = true;
		estimate.alpha = token.mesh.alpha;
		estimate.scale.set(scale * 0.25);
		estimate.position.set(token.x + (width / 2), token.y + x + y);
	}

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
			strokeThickness: 3 * Math.clamp(4 * this.gridScale, 1, 4),
			padding: 5,
			dropShadow: true,
			dropShadowColor,
			dropShadowDistance: Math.clamp(5 * this.gridScale, 1, 5),
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
				const actor = token.actor;
				const args = {
					actor,
					items: actor.items,
					effects: actor.effects,
					flags: actor.flags,
					name: actor.name,
					system: actor.system,
					token,
					type: actor.type,
					...actor.getRollData()
				};
				delete args.class;
				const logic = `${customLogic}\nreturn ${rule}`;
				// eslint-disable-next-line no-new-func
				return new Function(...Object.keys(args), logic)(...Object.values(args));
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
			if (isDead) {
				color = this.deadColor;
				stroke = this.deadOutline;
			} else {
				color = this.colors[colorIndex];
				stroke = this.outline[colorIndex];
				if (token.document.disposition === -2) stroke = CONFIG.Canvas.dispositionColors.SECRET;
			}
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
		if (CONFIG.debug.healthEstimate && !Number.isNumeric(fraction)) {
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
		const combatRunning = [...game.combats].some(
			(combat) => combat.started && (combat._source.scene === canvas.scene._id || combat._source.scene === null)
		);
		const combatTrigger = this.combatOnly && combatRunning;
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
			: CONFIG.statusEffects.dead?.img ?? this.deathMarker;
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
						false
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
		this.scaleToTokenSize = sGet("core.menuSettings.scaleToTokenSize");
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

	static onceCanvasReady() {
		this.combatOnly = sGet("core.combatOnly");
		this.alwaysShow = sGet("core.alwaysShow");
		Hooks.on("refreshToken", HealthEstimate.refreshToken.bind(this));
		if (this.scaleToZoom) Hooks.on("canvasPan", HealthEstimate.onCanvasPan.bind(this));
	}

	/**
	 * HP storing code for canvas load or token created
	 */
	static onCanvasReady() {
		this._cache = {};
		canvas.interface.healthEstimate = canvas.interface.addChild(new PIXI.Container());
		const { width, height } = canvas.dimensions;
		canvas.interface.healthEstimate.width = width;
		canvas.interface.healthEstimate.height = height;
		canvas.interface.healthEstimate.eventMode = "none";
		canvas.interface.healthEstimate.interactiveChildren = false;
		canvas.interface.healthEstimate.zIndex = 200;

		/** @type {[Token]} */
		const tokens = canvas.tokens?.placeables.filter((e) => e.actor) ?? [];
		tokens.forEach(addCharacter);
	}

	static onCanvasPan(canvas, pan) {
		const scale = () => {
			const zoomLevel = Math.min(1, pan.scale);
			if (this.lastZoom !== zoomLevel) {
				canvas.tokens?.placeables
					.filter((token) => this._cache[token.id]?.visible)
					.forEach((token) => {
						const estimate = this._cache[token.id];
						if (estimate?._texture) {
							estimate.style.fontSize = this.scaledFontSize;
						}
					});
			}
			this.lastZoom = zoomLevel;
		};
		if (this.alwaysShow) {
			if (this.timeout) clearTimeout(this.timeout);
			this.timeout = setTimeout(scale, 10);
		} else scale();
	}

	static onCreateToken(tokenDocument, options, userId) {
		if (tokenDocument.object) addCharacter(tokenDocument.object);
	}

	// /////////
	// ACTOR //
	// /////////

	static onUpdateActor(actor, data, options, userId) {
		if (this.alwaysShow) {
			// Get all the tokens because there can be two tokens of the same linked actor.
			const tokens = canvas.tokens?.placeables.filter((token) => token?.actor?.id === actor.id);
			// Call the _handleOverlay method for each token.
			tokens?.forEach((token) => this._handleOverlay(token, true));
		}
		if (this.outputChat && game.users.activeGM?.isSelf) {
			// Find a single token associated with the updated actor.
			const token = canvas.tokens?.placeables.find((token) => token?.actor?.id === actor.id);
			if (token) {
				const tokenId = token?.id;
				const tokenHP = this.actorsCurrentHP?.[tokenId];
				if (
					tokenId
					&& tokenHP
					&& !this.breakOverlayRender(token)
					&& !this.hideEstimate(token)
				) {
					outputStageChange(token);
				}
			}
		}
	}

	static deleteActor(actorDocument, options, userId) {
		let tokens = canvas.tokens?.placeables.filter((e) => e.document.actorId === actorDocument.id);
		tokens.forEach((token) => token.refresh());
	}

	static deleteToken(tokenDocument, options, userId) {
		const estimate = this._cache[tokenDocument.id];
		if (!estimate) return;
		delete this._cache[tokenDocument.id];
		estimate.parent?.removeChild(estimate);
		estimate.destroy();
	}

	static deleteActiveEffect(activeEffect, options, userId) {
		if (activeEffect.img === this.deathMarker) {
			let tokens = canvas.tokens?.placeables.filter((e) => e.actor && e.actor.id === activeEffect.parent.id);
			for (let token of tokens) {
				if (token.document.flags?.healthEstimate?.dead) token.document.unsetFlag("healthEstimate", "dead");
			}
		}
	}

	// /////////
	// TOKEN //
	// /////////

	static refreshToken(token, flags) {
		const displayed = token.hover || canvas.tokens.highlightObjects;
		this._handleOverlay(token, this.showCondition(displayed));
		if (flags.refreshSize && this.tooltipPosition) repositionTooltip(token);
		this.provider.refreshToken?.(token, flags);
	}

	static onCombatStart(combat, updateData) {
		if (!this.combatOnly) return;
		canvas.tokens?.placeables.forEach((token) => {
			this._handleOverlay(token, this.showCondition(token.hover));
		});
	}

	static onUpdateCombat(combat, options, userId) {
		if (!this.combatOnly) return;
		canvas.tokens?.placeables.forEach((token) => {
			this._handleOverlay(token, this.showCondition(token.hover));
		});
	}

	// /////////////
	// RENDERING //
	// /////////////

	/**
	 * Chat Styling
	 */
	static onRenderChatMessage(app, html, data) {
		if (html.find(".hm_messageheal").length) html.addClass("hm_message hm_messageheal");
		else if (html.find(".hm_messagetaken").length) html.addClass("hm_message hm_messagetaken");
	}

	/**
	 * Handler called when token configuration window is opened. Injects custom form html and deals
	 * with updating token.
	 * @category GMOnly
	 * @function
	 * @async
	 * @param {SettingsConfig} settingsConfig
	 * @param {JQuery} html
	 */
	static renderSettingsConfigHandler(settingsConfig, html) {
		if (!game.user.isGM) return;
		// Chat Output setting changes
		const outputChat = game.settings.get("healthEstimate", "core.outputChat");
		const outputChatCheckbox = html.querySelector('input[name="healthEstimate.core.outputChat"]');
		const unknownEntityInput = html.querySelector('input[name="healthEstimate.core.unknownEntity"]');
		disableCheckbox(unknownEntityInput, outputChat);
		outputChatCheckbox.addEventListener("change", (event) => {
			disableCheckbox(unknownEntityInput, event.target.checked);
		});

		// Additional PF1 system settings
		if (game.settings.settings.has("healthEstimate.PF1.showExtra")) {
			const showExtra = game.settings.get("healthEstimate", "PF1.showExtra");
			const showExtraCheckbox = html.querySelector('input[name="healthEstimate.PF1.showExtra"]');
			const disabledNameInput = html.querySelector('input[name="healthEstimate.PF1.disabledName"]');
			const dyingNameInput = html.querySelector('input[name="healthEstimate.PF1.dyingName"]');
			disableCheckbox(disabledNameInput, showExtra);
			disableCheckbox(dyingNameInput, showExtra);

			showExtraCheckbox.addEventListener("change", (event) => {
				disableCheckbox(disabledNameInput, event.target.checked);
				disableCheckbox(dyingNameInput, event.target.checked);
			});
		}

		// Additional PF2e system settings
		if (game.settings.settings.has("healthEstimate.PF2E.workbenchMystifier")) {
			const workbenchMystifierCheckbox = html.querySelector('input[name="healthEstimate.PF2E.workbenchMystifier"]');
			disableCheckbox(workbenchMystifierCheckbox, outputChat);

			outputChatCheckbox.addEventListener("change", (event) => {
				disableCheckbox(workbenchMystifierCheckbox, event.target.checked);
			});
		}
	}

	static async renderTokenConfigHandler(form, data, options, docPath = "document") {
		if (!options.isFirstRender) return;
		const tokenFlags = data[docPath].flags?.healthEstimate ?? {};
		const tabData = {
			hasPlayerOwner: data[docPath].hasPlayerOwner,
			hideHealthEstimate: tokenFlags?.hideHealthEstimate ? "checked" : "",
			hideName: tokenFlags?.hideName ? "checked" : "",
			dontMarkDead: tokenFlags?.dontMarkDead ? "checked" : "",
			dontMarkDeadHint: f("core.keybinds.dontMarkDead.hint", { setting: t("core.NPCsJustDie.name") }),
			hideNameHint: f("core.keybinds.hideNames.hint", { setting: t("core.outputChat.name") }),
		};
		const tab = await foundry.applications.handlebars.renderTemplate("modules/healthEstimate/templates/token-config.html", tabData);
		const lastTab = [...form.querySelectorAll(".tab")].pop();
		lastTab.insertAdjacentHTML("afterend", tab);
	}
}
