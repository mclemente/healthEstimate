import { addCharacter, outputStageChange } from "./HealthMonitor.js";
import { injectConfig } from "./injectConfig.js";
import { disableCheckbox, f, sGet, t } from "./utils.js";

export class HealthEstimateHooks {
	static canvasInit(canvas) {
		game.healthEstimate.combatRunning = game.healthEstimate.isCombatRunning();
		game.healthEstimate.lastZoom = null;
	}

	static onceCanvasReady() {
		game.healthEstimate.combatOnly = sGet("core.combatOnly");
		if (game.healthEstimate.combatOnly) HealthEstimateHooks.combatHooks(game.healthEstimate.combatOnly);
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
			if (zoomLevel < 1 && game.healthEstimate.lastZoom !== zoomLevel) {
				canvas.tokens?.placeables
					.filter((t) => t.healthEstimate?.visible)
					.forEach((token) => {
						let fontSize = game.healthEstimate.fontSize / zoomLevel;
						if (token.healthEstimate?._texture) {
							token.healthEstimate.style.fontSize = fontSize * 4;
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
		addCharacter(tokenDocument.object);
	}

	// /////////
	// ACTOR //
	// /////////

	static onUpdateActor(actor, data, options, userId) {
		if (game.healthEstimate.alwaysShow) {
			// Get all the tokens on the off-chance there's two tokens of the same linked actor.
			const tokens = canvas.tokens?.placeables.filter((token) => {
				if (options?.syntheticActorUpdate) {
					return token?.id === actor.token.id;
				}
				return token?.actor?.id === actor.id;
			});
			// Call the _handleOverlay method for each token.
			tokens?.forEach((token) => {
				game.healthEstimate._handleOverlay(token, true);
			});
		}
		if (game.healthEstimate.outputChat && game.users.activeGM?.isSelf) {
			// Find a single token associated with the updated actor.
			const token = canvas.tokens?.placeables.find((token) => {
				if (options?.syntheticActorUpdate) {
					return token?.id === actor.token.id;
				}
				return token?.actor?.id === actor.id;
			});
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

	static deleteActiveEffect(activeEffect, options, userId) {
		if (activeEffect.icon === game.healthEstimate.deathMarker) {
			let tokens = canvas.tokens?.placeables.filter((e) => e.actor && e.actor.id === activeEffect.parent.id);
			for (let token of tokens) {
				if (token.document.flags?.healthEstimate?.dead) token.document.unsetFlag("healthEstimate", "dead");
			}
		}
	}

	// /////////
	// TOKEN //
	// /////////

	static refreshToken(token) {
		game.healthEstimate._handleOverlay(token, game.healthEstimate.showCondition(token.hover));
	}

	// Not an actual hook
	static combatHooks(value) {
		if (value) {
			Hooks.on("combatStart", HealthEstimateHooks.onCombatStart);
			Hooks.on("updateCombat", HealthEstimateHooks.onUpdateCombat);
			Hooks.on("deleteCombat", HealthEstimateHooks.onUpdateCombat);
		} else {
			Hooks.off("combatStart", HealthEstimateHooks.onCombatStart);
			Hooks.off("updateCombat", HealthEstimateHooks.onUpdateCombat);
			Hooks.off("deleteCombat", HealthEstimateHooks.onUpdateCombat);
		}
	}

	static onCombatStart(combat, updateData) {
		game.healthEstimate.combatRunning = true;
		canvas.tokens?.placeables.forEach((token) => {
			game.healthEstimate._handleOverlay(token, game.healthEstimate.showCondition(token.hover));
		});
	}

	static onUpdateCombat(combat, options, userId) {
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
		// Chat Output setting changes
		const outputChat = game.settings.get("healthEstimate", "core.outputChat");
		const outputChatCheckbox = html.find('input[name="healthEstimate.core.outputChat"]');
		const unknownEntityInput = html.find('input[name="healthEstimate.core.unknownEntity"]');
		disableCheckbox(unknownEntityInput, outputChat);
		outputChatCheckbox.on("change", (event) => {
			disableCheckbox(unknownEntityInput, event.target.checked);
		});

		// Additional PF1 system settings
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

		// Additional PF2e system settings
		if (game.settings.settings.has("healthEstimate.PF2E.workbenchMystifier")) {
			const workbenchMystifierCheckbox = html.find('input[name="healthEstimate.PF2E.workbenchMystifier"]');
			disableCheckbox(workbenchMystifierCheckbox, outputChat);

			outputChatCheckbox.on("change", (event) => {
				disableCheckbox(workbenchMystifierCheckbox, event.target.checked);
			});
		}
	}

	static renderHealthEstimateStyleSettingsHandler(settingsConfig, html) {
		const useColor = game.settings.get("healthEstimate", "core.menuSettings.useColor");
		const useColorCheckbox = html.find('input[name="useColor"]');
		const smoothGradientForm = html.find('input[name="smoothGradient"]').parent()[0];
		const gradientForm = html.find('div[class="form-group gradient"]')[0];
		const deadColorForm = html.find('input[name="deadColor"]').parent()[0];
		const outlineModeForm = html.find('select[id="outlineMode"]').parent()[0];

		function hideForm(form, boolean) {
			form.style.display = !boolean ? "none" : "flex";
		}

		hideForm(smoothGradientForm, useColor);
		hideForm(gradientForm, useColor);
		hideForm(deadColorForm, useColor);
		hideForm(outlineModeForm, useColor);

		useColorCheckbox.on("change", (event) => {
			hideForm(smoothGradientForm, event.target.checked);
			hideForm(gradientForm, event.target.checked);
			hideForm(deadColorForm, event.target.checked);
			hideForm(outlineModeForm, event.target.checked);
		});
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
	static async renderTokenConfigHandler(tokenConfig, html) {
		const moduleId = "healthEstimate";
		const tab = {
			name: moduleId,
			label: "Estimates",
			icon: "fas fa-scale-balanced",
		};
		injectConfig.inject(tokenConfig, html, { moduleId, tab }, tokenConfig.object);

		const posTab = html.find(`.tab[data-tab="${moduleId}"]`);
		const tokenFlags = tokenConfig.options.sheetConfig
			? tokenConfig.object.flags?.healthEstimate
			: tokenConfig.token.flags?.healthEstimate;

		const data = {
			hideHealthEstimate: tokenFlags?.hideHealthEstimate ? "checked" : "",
			hideName: tokenFlags?.hideName ? "checked" : "",
			dontMarkDead: tokenFlags?.dontMarkDead ? "checked" : "",
			dontMarkDeadHint: f("core.keybinds.dontMarkDead.hint", { setting: t("core.NPCsJustDie.name") }),
			hideNameHint: f("core.keybinds.hideNames.hint", { setting: t("core.outputChat.name") }),
		};

		const insertHTML = await renderTemplate(`modules/${moduleId}/templates/token-config.html`, data);
		posTab.append(insertHTML);
	}
}
