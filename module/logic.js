import { breakOverlayRender, descriptionToShow, fractionFormula, updateBreakSettings } from "./systemSpecifics.js";
import { sGet, t } from "./utils.js";

export let descriptions, deathStateName, showDead, useColor, smooth, NPCsJustDie, deathMarker, colors, outline, deadColor, deadOutline, perfectionism, outputChat;

let current_hp_actor = {}; //store hp of PC

export function getCharacters(actors) {
	for (let actor of actors) {
		if (breakOverlayRender(actor)) continue;
		try {
			const fraction = Math.min(fractionFormula(actor), 1);
			const stage = Math.max(0, perfectionism ? Math.ceil((descriptions.length - 2 + Math.floor(fraction)) * fraction) : Math.ceil((descriptions.length - 1) * fraction));
			current_hp_actor[actor.data._id] = { name: actor.document.data.name || actor.name, stage: stage, dead: isDead(actor, stage) };
		} catch (err) {
			console.error(`Health Estimate | Error on getCharacters(). Token Name: %o. Type: %o`, actor.name, actor.document.actor.data.type, err);
		}
	}
}

export function outputStageChange(actors) {
	for (let actor of actors) {
		if (breakOverlayRender(actor)) continue;
		try {
			const fraction = Math.min(fractionFormula(actor), 1);
			const stage = Math.max(0, perfectionism ? Math.ceil((descriptions.length - 2 + Math.floor(fraction)) * fraction) : Math.ceil((descriptions.length - 1) * fraction));
			const dead = isDead(actor, stage);
			if (stage != undefined && (stage != current_hp_actor[actor.data._id].stage || dead != current_hp_actor[actor.data._id].dead)) {
				let name = current_hp_actor[actor.data._id].name;
				if ((actor.document.getFlag("healthEstimate", "hideName") || actor.document.getFlag("healthEstimate", "hideHealthEstimate")) && actor.data.displayName == 0) {
					name = "Unknown entity";
				}
				let css = "<span class='hm_messagetaken'>";
				if (stage > current_hp_actor[actor.data._id].stage) {
					css = "<span class='hm_messageheal'>";
				}
				let desc = descriptionToShow(
					descriptions,
					stage,
					actor,
					{
						isDead: dead,
						desc: deathStateName,
					},
					fraction
				);
				let chatData = {
					content: css + name + " " + t("core.isNow") + " " + desc + ".</span>",
				};
				ChatMessage.create(chatData, {});
				current_hp_actor[actor.data._id].stage = stage;
				current_hp_actor[actor.data._id].dead = dead;
			}
		} catch (err) {
			console.error(`Health Estimate | Error on outputStageChange(). Token Name: %o. Type: %o`, actor.name, actor.document.actor.data.type, err);
		}
	}
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
export function isDead(token, stage) {
	return (
		(NPCsJustDie && !token.actor.hasPlayerOwner && stage === 0) ||
		(showDead && Array.from(token.actor.effects.values()).some((x) => x.data.icon === deathMarker)) ||
		token.document.getFlag("healthEstimate", "dead") ||
		false
	);
}

/**
 * Updates the variables if any setting was changed.
 */
export function updateSettings() {
	useColor = sGet("core.menuSettings.useColor");
	descriptions = sGet("core.stateNames").split(/[,;]\s*/);
	smooth = sGet("core.menuSettings.smoothGradient");
	deathStateName = sGet("core.deathStateName");
	showDead = sGet("core.deathState");
	NPCsJustDie = sGet("core.NPCsJustDie");
	deathMarker = sGet("core.deathMarker");
	colors = sGet("core.variables.colors");
	outline = sGet("core.variables.outline");
	deadColor = sGet("core.variables.deadColor");
	deadOutline = sGet("core.variables.deadOutline");
	perfectionism = sGet("core.perfectionism");
	outputChat = sGet("core.outputChat");

	const margin = `${sGet("core.menuSettings.positionAdjustment")}em`;
	const alignment = sGet("core.menuSettings.position");
	document.documentElement.style.setProperty("--healthEstimate-margin", margin);
	document.documentElement.style.setProperty("--healthEstimate-alignment", alignment);
	document.documentElement.style.setProperty("--healthEstimate-text-size", sGet("core.menuSettings.fontSize"));
}

/**
 * Creates the Overlay with the text on mouse over.
 */
class HealthEstimateOverlay extends BasePlaceableHUD {
	static get defaultOptions() {
		const options = super.defaultOptions;
		options.classes = options.classes.concat(["healthEstimate", "healthEstimateColor"]);
		options.template = "modules/healthEstimate/templates/healthEstimate.hbs";
		options.id = "healthEstimate";
		return options;
	}

	/**
	 * Sets the position of the overlay.
	 * This override is needed because the overlay goes off-center on Hexagonal Rows grid types.
	 * See https://github.com/mclemente/healthEstimate/issues/19 for visual examples.
	 */
	setPosition({ left, top, width, height, scale } = {}) {
		if (canvas.grid.type === 2 || canvas.grid.type === 3) {
			left = (left ?? this.object.x) - 6;
		}
		super.setPosition({ left, top, width, height, scale });
	}

	/**
	 * This override is only here because Health Estimate spams the Console with Rendering logs.
	 */
	async _render(force = false, options = {}) {
		// Do not render under certain conditions
		const states = Application.RENDER_STATES;
		this._priorState = this._state;
		if ([states.CLOSING, states.RENDERING].includes(this._state)) return;

		// Applications which are not currently rendered must be forced
		if (!force && this._state <= states.NONE) return;

		// Begin rendering the application
		if ([states.NONE, states.CLOSED, states.ERROR].includes(this._state) && this.showRendering) {
			console.log(`${vtt} | Rendering ${this.constructor.name}`);
		}
		this._state = states.RENDERING;

		// Merge provided options with those supported by the Application class
		foundry.utils.mergeObject(this.options, options, { insertKeys: false });

		// Get the existing HTML element and application data used for rendering
		const element = this.element;
		const data = await this.getData(this.options);

		// Store scroll positions
		if (element.length && this.options.scrollY) this._saveScrollPositions(element);

		// Render the inner content
		const inner = await this._renderInner(data);
		let html = inner;

		// If the application already exists in the DOM, replace the inner content
		if (element.length) this._replaceHTML(element, html);
		// Otherwise render a new app
		else {
			// Wrap a popOut application in an outer frame
			if (this.popOut) {
				html = await this._renderOuter();
				html.find(".window-content").append(inner);
				ui.windows[this.appId] = this;
			}

			// Add the HTML to the DOM and record the element
			this._injectHTML(html);
		}

		// Activate event listeners on the inner HTML
		this._activateCoreListeners(inner);
		this.activateListeners(inner);

		// Set the application position (if it's not currently minimized)
		if (!this._minimized) {
			foundry.utils.mergeObject(this.position, options, { insertKeys: false });
			this.setPosition(this.position);
		}

		// Apply focus to the application, maximizing it and bringing it to the top
		if (options.focus === true) {
			this.maximize().then(() => this.bringToTop());
		}

		// Dispatch Hooks for rendering the base and subclass applications
		for (let cls of this.constructor._getInheritanceChain()) {
			/**
			 * A hook event that fires whenever this Application is rendered.
			 * The hook provides the pending application HTML which will be added to the DOM.
			 * Hooked functions may modify that HTML or attach interactive listeners to it.
			 *
			 * @function renderApplication
			 * @memberof hookEvents
			 * @param {Application} app		 The Application instance being rendered
			 * @param {jQuery} html				 The inner HTML of the document that will be displayed and may be modified
			 * @param {object} data				 The object of data used when rendering the application
			 */
			Hooks.call(`render${cls.name}`, this, html, data);
		}

		// Restore prior scroll positions
		if (this.options.scrollY) this._restoreScrollPositions(html);
		this._state = states.RENDERED;
		this.setPosition();
	}

	getData() {
		const data = super.getData();
		data.status = this.estimation;
		return data;
	}
}

export class HealthEstimate {
	constructor() {
		updateBreakSettings();
		canvas.hud.HealthEstimate = new HealthEstimateOverlay();
		updateSettings();
		this.initHooks();
	}

	initHooks() {
		Hooks.on("hoverToken", (token, hovered) => {
			this._handleOverlay(token, hovered);
		});

		Hooks.on("deleteToken", (...args) => {
			canvas.hud.HealthEstimate.clear();
		});

		Hooks.on("updateToken", (scene, token, ...args) => {
			if (canvas.hud.HealthEstimate !== undefined && canvas.hud.HealthEstimate.object) {
				if (token._id === canvas.hud.HealthEstimate.object.id) {
					canvas.hud.HealthEstimate.clear();
				}
			}
		});
	}

	_handleOverlay(token, hovered) {
		if (!token?.actor) {
			return;
		}
		if (
			breakOverlayRender(token) ||
			(!game.user.isGM && (token.document.getFlag("healthEstimate", "hideHealthEstimate") || token.actor.getFlag("healthEstimate", "hideHealthEstimate")))
		) {
			return;
		}
		const width = `${canvas.scene.data.grid * token.data.width}px`;
		document.documentElement.style.setProperty("--healthEstimate-width", width);

		if (hovered) {
			this._getEstimation(token);
			canvas.hud.HealthEstimate.bind(token);
		} else {
			canvas.hud.HealthEstimate.clear();
		}
	}

	_getEstimation(token) {
		try {
			const fraction = Math.min(fractionFormula(token), 1);
			const stage = Math.max(0, perfectionism ? Math.ceil((descriptions.length - 2 + Math.floor(fraction)) * fraction) : Math.ceil((descriptions.length - 1) * fraction));
			const colorIndex = Math.max(0, Math.ceil((colors.length - 1) * fraction));
			let desc, color, stroke;

			desc = descriptionToShow(
				descriptions,
				stage,
				token,
				{
					isDead: isDead(token, stage),
					desc: deathStateName,
				},
				fraction
			);
			color = colors[colorIndex];
			stroke = outline[colorIndex];
			if (isDead(token, stage)) {
				color = deadColor;
				stroke = deadOutline;
			}
			document.documentElement.style.setProperty("--healthEstimate-stroke-color", stroke);
			document.documentElement.style.setProperty("--healthEstimate-text-color", color);
			canvas.hud.HealthEstimate.estimation = { desc };
		} catch (err) {
			console.error(`Health Estimate | Error on HealthEstimate._getEstimation(). Token Name: %o. Type: %o`, token.name, token.document.actor.data.type, err);
		}
	}
}
