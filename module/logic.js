import * as providers from "./EstimationProvider.js";
import { registerSettings } from "./settings.js";
import { addSetting, isEmpty, sGet, t } from "./utils.js";

export class HealthEstimate {
	/** Changes which users get to see the overlay. */
	breakConditions = {
		default: `false`,
	};

	//Hooks
	setup() {
		this.estimationProvider = this.prepareSystemSpecifics();
		this.fractionFormula = this.estimationProvider.fraction;
		if (this.estimationProvider.breakCondition !== undefined) this.breakConditions.system = this.estimationProvider.breakCondition;
		registerSettings();
		for (let [key, data] of Object.entries(this.estimationProvider.settings)) {
			addSetting(key, data);
		}
		this.updateBreakConditions();
		this.updateSettings();
	}

	/**
	 * Gets system specifics, such as its hp attribute and other settings.
	 * @returns {providers.EstimationProvider}
	 */
	prepareSystemSpecifics() {
		const providerArray = Object.keys(providers);
		const supportedSystems = providerArray.join("|").replace(/EstimationProvider/g, "");
		const systemsRegex = new RegExp(supportedSystems);
		if (systemsRegex.test(game.system.id)) var providerString = game.system.id;
		else providerString = providers.providerKeys[game.system.id] || "Generic";
		const providerClassName = `${providerString}EstimationProvider`;
		return new providers[providerClassName](`native.${providerString}`);
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
		if (this.alwaysShow) {
			canvas.tokens?.placeables.forEach((token) => {
				this._handleOverlay(token, true);
			});
			if (this.scaleToZoom) Hooks.on("canvasPan", this.onCanvasPan);
			Hooks.on("updateActor", this.alwaysOnUpdateActor);
			if (!(game.version > 11)) Hooks.on("updateToken", this.alwaysOnUpdateToken);
		}
		Hooks.on("canvasInit", this.canvasInit.bind(this));
	}

	/**
	 * @param {Token} token
	 * @param {Boolean} hovered
	 */
	_handleOverlay(token, hovered) {
		if (token.healthEstimate?._texture) token.healthEstimate.destroy();
		if (!token?.actor || this.breakOverlayRender(token) || (!game.user.isGM && this.hideEstimate(token)) || !token.isVisible) return;

		try {
			if (hovered) {
				const { desc, color, stroke } = this.getEstimation(token);
				if (!desc) {
					return;
				}
				const zoomLevel = Math.min(1, canvas.stage.scale.x);
				const userTextStyle = this._getUserTextStyle(zoomLevel, color, stroke);
				token.healthEstimate = token.addChild(new PIXI.Text(desc, userTextStyle));
				token.healthEstimate.scale.set(0.25);

				token.healthEstimate.anchor.set(0.5, this.scaleToZoom && zoomLevel < 1 ? 0 : this.margin);
				token.healthEstimate.position.set(token.tooltip.x, token.tooltip.y + (Number.isNumeric(this.alignment) ? this.alignment : -65));
			} else if (token.healthEstimate) token.healthEstimate.visible = false;
		} catch (err) {
			console.error(`Health Estimate | Error on function _handleOverlay(). Token Name: "${token.name}". ID: "${token.id}". Type: "${token.document.actor.type}".`, err);
		}
	}

	_getUserTextStyle(zoomLevel, color, stroke) {
		if (this.scaleToZoom && zoomLevel < 1) var fontSize = 24 * (1 / zoomLevel);
		else fontSize = Number.isNumeric(this.fontSize) ? this.fontSize : 24;

		return {
			fontSize: fontSize * 4,
			fontFamily: CONFIG.canvasTextStyle.fontFamily,
			fill: color,
			stroke,
			strokeThickness: 12,
			padding: 5,
		};
	}

	/**
	 * Returns an array of estimates related to the token.
	 * deepClone is used here because changes will reflect locally on the estimations setting (see {@link getEstimation})
	 * @param {TokenDocument} token
	 */
	getTokenEstimate(token) {
		let special;
		const validateEstimation = (token, rule) => {
			const customLogic = this.estimationProvider.customLogic;
			return new Function("token", customLogic + `return ${rule}`)(token);
		};

		for (const estimation of this.estimations) {
			if (estimation.rule === "default" || estimation.rule === "") continue;
			if (validateEstimation(token, estimation.rule)) {
				if (estimation.ignoreColor) {
					special = estimation;
				} else return { estimation: deepClone(estimation), special: deepClone(special) };
			}
		}
		return { estimation: deepClone(this.estimations[0]), special: deepClone(special) };
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

			const colorIndex = this.smoothGradient ? Math.max(0, Math.ceil((this.colors.length - 1) * fraction)) : index;
			estimate.label = isDead ? this.deathStateName : estimate.label;
			color = isDead ? this.deadColor : this.colors[colorIndex];
			stroke = isDead ? this.deadOutline : this.outline[colorIndex];
			desc = this.hideEstimate(token) ? `${estimate.label}*` : estimate.label;
			return { desc, color, stroke };
		} catch (err) {
			console.error(`Health Estimate | Error on getEstimation(). Token Name: "${token.name}". Type: "${token.document.actor.type}".`, err);
			return { desc, color, stroke };
		}
	}

	/**
	 * Returns the current health fraction of the token.
	 * @param {TokenDocument} token
	 * @returns {Number}
	 */
	getFraction(token) {
		const fraction = Math.max(0, Math.min(this.fractionFormula(token), 1));
		if (!Number.isNumeric(fraction)) {
			throw Error(`Token's fraction is not valid, it probably doesn't have a numerical HP or Max HP value.`);
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
			if (fraction != 0 && Math.floor(fraction) == 0) fraction = 0.1;
			else fraction = Math.trunc(fraction);
			const logic = (e) => e.value >= fraction;
			const estimate = special ? special.estimates.find(logic) : estimation.estimates.find(logic) ?? { value: fraction, label: "" };
			const index = estimation.estimates.findIndex(logic);
			return { estimate, index };
		} catch (err) {
			console.error(`Health Estimate | Error on getStage(). Token Name: "${token.name}". Type: "${token.document.actor.type}".`, err);
		}
	}

	//Utils
	hideEstimate(token) {
		return token.document.getFlag("healthEstimate", "hideHealthEstimate") || token.actor.getFlag("healthEstimate", "hideHealthEstimate");
	}

	//Hooked functions don't interact correctly with "this"
	onCanvasPan(canvas, constrained) {
		if (game.healthEstimate.alwaysShow) {
			canvas.tokens?.placeables.forEach((token) => {
				game.healthEstimate._handleOverlay(token, game.healthEstimate.showCondition(token.hovered));
			});
		}
	}

	//Hooked functions don't interact correctly with "this"
	alwaysOnUpdateActor(actor, updates, options, userId) {
		//Get all the tokens on the off-chance there's two tokens of the same linked actor.
		const tokens = canvas.tokens?.placeables.filter((token) => token.actor?.id === actor.id);
		// Call the _handleOverlay method for each token.
		tokens?.forEach((token) => {
			game.healthEstimate._handleOverlay(token, true);
		});
	}

	combatStart(combat, updateData) {
		game.healthEstimate.combatRunning = true;
		canvas.tokens?.placeables.forEach((token) => {
			game.healthEstimate._handleOverlay(token, game.healthEstimate.showCondition(token.hover));
		});
	}

	updateCombat(combat, options, userId) {
		game.healthEstimate.combatRunning = game.healthEstimate.isCombatRunning();
		canvas.tokens?.placeables.forEach((token) => {
			game.healthEstimate._handleOverlay(token, game.healthEstimate.showCondition(token.hover));
		});
	}

	combatHooks(value) {
		if (value) {
			Hooks.on("combatStart", game.healthEstimate.combatStart);
			Hooks.on("updateCombat", game.healthEstimate.updateCombat);
			Hooks.on("deleteCombat", game.healthEstimate.updateCombat);
		} else {
			Hooks.off("combatStart", game.healthEstimate.combatStart);
			Hooks.off("updateCombat", game.healthEstimate.updateCombat);
			Hooks.off("deleteCombat", game.healthEstimate.updateCombat);
		}
	}

	isCombatRunning() {
		return [...game.combats].some((combat) => combat.started && (combat._source.scene == canvas.scene._id || combat._source.scene == null));
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
		const isNPCJustDie = this.NPCsJustDie && !token.actor.hasPlayerOwner && stage === 0 && !token.document.getFlag("healthEstimate", "dontMarkDead");
		const isShowDead = this.showDead && token.combatant?.defeated;
		const isFlaggedDead = token.document.getFlag("healthEstimate", "dead") || false;

		return isOrganicType && (isNPCJustDie || isShowDead || isFlaggedDead);
	}

	showCondition(hovered) {
		const combatTrigger = this.combatOnly && this.combatRunning;
		return (this.alwaysShow && (combatTrigger || !this.combatOnly)) || (hovered && (combatTrigger || !this.combatOnly));
	}

	updateBreakConditions() {
		this.breakConditions.onlyGM = sGet("core.showDescription") == 1 ? `|| !game.user.isGM` : "";
		this.breakConditions.onlyNotGM = sGet("core.showDescription") == 2 ? `|| game.user.isGM` : "";
		this.breakConditions.onlyPCs = sGet("core.showDescriptionTokenType") == 1 ? `|| !token.actor?.hasPlayerOwner` : "";
		this.breakConditions.onlyNPCs = sGet("core.showDescriptionTokenType") == 2 ? `|| token.actor?.hasPlayerOwner` : "";

		const prep = (key) => (isEmpty(this.breakConditions[key]) ? "" : this.breakConditions[key]);

		this.breakOverlayRender = (token) =>
			new Function(
				`token`,
				`return (
				${prep("default")}
				${prep("onlyGM")}
				${prep("onlyNotGM")}
				${prep("onlyNPCs")}
				${prep("onlyPCs")}
				${prep("system")}
			)`
			)(token);
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
