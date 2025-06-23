import { addCharacter, outputStageChange } from "./HealthMonitor.js";
import { disableCheckbox, repositionTooltip, sGet, startCanvasInterface } from "./utils.js";

export class HealthEstimateHooks {
	static canvasInit(canvas) {
		game.healthEstimate.combatRunning = game.healthEstimate.isCombatRunning();
		game.healthEstimate.lastZoom = null;
	}

	static onceCanvasReady() {
		startCanvasInterface();
		game.healthEstimate.combatOnly = sGet("core.combatOnly");
		game.healthEstimate.alwaysShow = sGet("core.alwaysShow");
		game.healthEstimate.combatRunning = game.healthEstimate.isCombatRunning();
		Hooks.on("refreshToken", HealthEstimateHooks.refreshToken);
		if (game.healthEstimate.alwaysShow) {
			canvas.tokens?.placeables.forEach((token) => game.healthEstimate._handleOverlay(token, true));
		}
		if (game.healthEstimate.scaleToZoom) Hooks.on("canvasPan", HealthEstimateHooks.onCanvasPan);
		Hooks.on("canvasInit", HealthEstimateHooks.canvasInit);
	}

	/**
	 * HP storing code for canvas load or token created
	 */
	static onCanvasReady() {
		startCanvasInterface();

		/** @type {[Token]} */
		const tokens = canvas.tokens?.placeables.filter((e) => e.actor) ?? [];
		tokens.forEach(addCharacter);

		if (game.healthEstimate.alwaysShow) {
			canvas.tokens?.placeables.forEach((token) => {
				game.healthEstimate._handleOverlay(token, true);
			});
		}
	}

	static onCanvasPan(canvas, constrained) {
		const scale = () => {
			const zoomLevel = Math.min(1, canvas.stage.scale.x);
			if (game.healthEstimate.lastZoom !== zoomLevel) {
				canvas.tokens?.placeables
					.filter((t) => t.healthEstimate?.visible)
					.forEach((token) => {
						const estimate = game.healthEstimate._cache[token.id];
						if (estimate?._texture) {
							estimate.style.fontSize = game.healthEstimate.scaledFontSize;
						}
					});
			}
			game.healthEstimate.lastZoom = zoomLevel;
		};
		if (game.healthEstimate.alwaysShow) {
			if (this.timeout) clearTimeout(this.timeout);
			this.timeout = setTimeout(scale, 100);
		} else scale();
	}

	static onCreateToken(tokenDocument, options, userId) {
		if (tokenDocument.object) addCharacter(tokenDocument.object);
	}

	// /////////
	// ACTOR //
	// /////////

	static onUpdateActor(actor, data, options, userId) {
		if (game.healthEstimate.alwaysShow) {
			// Get all the tokens because there can be two tokens of the same linked actor.
			const tokens = canvas.tokens?.placeables.filter((token) => token?.actor?.id === actor.id);
			// Call the _handleOverlay method for each token.
			tokens?.forEach((token) => game.healthEstimate._handleOverlay(token, true));
		}
		if (game.healthEstimate.outputChat && game.users.activeGM?.isSelf) {
			// Find a single token associated with the updated actor.
			const token = canvas.tokens?.placeables.find((token) => token?.actor?.id === actor.id);
			if (token) {
				const tokenId = token?.id;
				const tokenHP = game.healthEstimate.actorsCurrentHP?.[tokenId];
				if (
					tokenId
					&& tokenHP
					&& !game.healthEstimate.breakOverlayRender(token)
					&& !game.healthEstimate.hideEstimate(token)
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
		const estimate = game.healthEstimate._cache[tokenDocument.id];
		if (!estimate) return;
		delete game.healthEstimate._cache[tokenDocument.id];
		canvas.interface.healthEstimate.removeChild(estimate);
		estimate.destroy();
	}

	static deleteActiveEffect(activeEffect, options, userId) {
		if (activeEffect.img === game.healthEstimate.deathMarker) {
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
		game.healthEstimate._handleOverlay(token, game.healthEstimate.showCondition(displayed));
		if (flags.refreshSize && game.healthEstimate.tooltipPosition) repositionTooltip(token);
	}

	static onCombatStart(combat, updateData) {
		if (!game.healthEstimate.combatOnly) return;
		game.healthEstimate.combatRunning = true;
		canvas.tokens?.placeables.forEach((token) => {
			game.healthEstimate._handleOverlay(token, game.healthEstimate.showCondition(token.hover));
		});
	}

	static onUpdateCombat(combat, options, userId) {
		if (!game.healthEstimate.combatOnly) return;
		game.healthEstimate.combatRunning = game.healthEstimate.isCombatRunning();
		canvas.tokens?.placeables.forEach((token) => {
			game.healthEstimate._handleOverlay(token, game.healthEstimate.showCondition(token.hover));
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
}
