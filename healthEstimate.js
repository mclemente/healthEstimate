import { getCharacters, onRenderChatMessage } from "./lib/HealthMonitor.js";
import { HealthEstimate } from "./module/logic.js";
import { onUpdateActor, onUpdateToken, renderSettingsConfigHandler, renderTokenConfigHandler } from "./module/settings.js";
import { f, t } from "./module/utils.js";

/**
 * Preload templates and add it template to the HUD
 */
Hooks.once("init", async function () {});

/**
 * Have to register Settings here, because doing so at init breaks i18n
 */
Hooks.once("setup", function () {
	setKeybinds();
	game.healthEstimate = new HealthEstimate();
	game.healthEstimate.setup();
	const outputChat = game.settings.get("healthEstimate", "core.outputChat");
	if (outputChat) {
		Hooks.on("updateActor", onUpdateActor);
		if (!game.version > 11) Hooks.on("updateToken", onUpdateToken);
	}
});

Hooks.once("canvasReady", function () {
	game.healthEstimate.canvasReady();
});

/**
 * HP storing code for canvas load or token created
 */
Hooks.on("canvasReady", function () {
	let tokens = canvas.tokens.placeables.filter((e) => e.actor);
	getCharacters(tokens);
});

Hooks.on("createToken", function (tokenDocument, options, userId) {
	const customStages = tokenDocument.actor.getFlag("healthEstimate", "customStages");
	if (customStages?.length) tokenDocument.setFlag("healthEstimate", "customStages", customStages);
	let tokens = canvas.tokens.placeables.filter((e) => e.actor);
	getCharacters(tokens);
});

/**
 * Chat Styling
 */
Hooks.on("renderChatMessage", onRenderChatMessage);

Hooks.on("renderSettingsConfig", renderSettingsConfigHandler);
Hooks.on("renderTokenConfig", renderTokenConfigHandler);

Hooks.on("deleteActiveEffect", (activeEffect, options, userId) => {
	if (activeEffect.icon == game.healthEstimate.deathMarker) {
		let tokens = canvas.tokens.placeables.filter((e) => e.actor && e.actor.id == activeEffect.parent.id);
		for (let token of tokens) {
			if (token.document.flags?.healthEstimate?.dead) token.document.unsetFlag("healthEstimate", "dead");
		}
	}
});

function setKeybinds() {
	game.keybindings.register("healthEstimate", "markDead", {
		name: "healthEstimate.core.keybinds.markDead.name",
		hint: "healthEstimate.core.keybinds.markDead.hint",
		onDown: () => {
			for (let e of canvas.tokens.controlled) {
				let hasAlive = !e.document.getFlag("healthEstimate", "dead");
				e.document.setFlag("healthEstimate", "dead", hasAlive);
			}
		},
		restricted: true,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});
	game.keybindings.register("healthEstimate", "dontMarkDead", {
		name: "healthEstimate.core.keybinds.dontMarkDead.name",
		hint: f("core.keybinds.dontMarkDead.hint", { setting: t("core.NPCsJustDie.name") }),
		onDown: () => {
			for (let e of canvas.tokens.controlled) {
				let hasAlive = !e.document.getFlag("healthEstimate", "treatAsPC");
				e.document.setFlag("healthEstimate", "treatAsPC", hasAlive);
			}
		},
		restricted: true,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});
	game.keybindings.register("healthEstimate", "hideEstimates", {
		name: "healthEstimate.core.keybinds.hideEstimates.name",
		hint: "healthEstimate.core.keybinds.hideEstimates.hint",
		onDown: () => {
			for (let e of canvas.tokens.controlled) {
				let hidden = !e.document.getFlag("healthEstimate", "hideHealthEstimate");
				e.document.setFlag("healthEstimate", "hideHealthEstimate", hidden);
				if (hidden) ui.notifications.info(`${e.actor.name}'s health estimate is hidden from players.`, { console: false });
				else ui.notifications.info(`${e.actor.name}'s health estimate is shown to players.`, { console: false });
			}
		},
		restricted: true,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});
	game.keybindings.register("healthEstimate", "hideNames", {
		name: "healthEstimate.core.keybinds.hideNames.name",
		hint: f("core.keybinds.hideNames.hint", { setting: t("core.outputChat.name") }),
		onDown: () => {
			for (let e of canvas.tokens.controlled) {
				let hidden = !e.document.getFlag("healthEstimate", "hideName");
				e.document.setFlag("healthEstimate", "hideName", hidden);
				if (hidden) ui.notifications.info(`${e.actor.name}'s name is hidden from players.`, { console: false });
				else ui.notifications.info(`${e.actor.name}'s name is shown to players.`, { console: false });
			}
		},
		restricted: true,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});
	game.keybindings.register("healthEstimate", "hideEstimatesAndNames", {
		name: "healthEstimate.core.keybinds.hideEstimatesAndNames.name",
		hint: "healthEstimate.core.keybinds.hideEstimatesAndNames.hint",
		onDown: () => {
			for (let e of canvas.tokens.controlled) {
				let hidden = !e.document.getFlag("healthEstimate", "hideHealthEstimate") && !e.document.getFlag("healthEstimate", "hideName");
				e.document.setFlag("healthEstimate", "hideHealthEstimate", hidden);
				e.document.setFlag("healthEstimate", "hideName", hidden);
				if (hidden) ui.notifications.info(`${e.actor.name}'s health estimate and name are hidden from players.`, { console: false });
				else ui.notifications.info(`${e.actor.name}'s health estimate and name are shown to players.`, { console: false });
			}
		},
		restricted: true,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});
	game.keybindings.register("healthEstimate", "customEstimates", {
		name: "healthEstimate.core.keybinds.customEstimates.name",
		hint: "healthEstimate.core.keybinds.customEstimates.hint",
		onDown: (rgs) => {
			if (!canvas.tokens.controlled.length) {
				ui.notifications.warn(`You haven't selected any tokens.`, { console: false });
				return;
			}

			function setFlags(flag, changeActors = false) {
				for (let e of canvas.tokens.controlled) {
					if (changeActors) e.actor.setFlag("healthEstimate", "customStages", flag);
					e.document.setFlag("healthEstimate", "customStages", flag);
				}
			}
			function unsetFlags(changeActors = false) {
				for (let e of canvas.tokens.controlled) {
					if (changeActors) e.actor.unsetFlag("healthEstimate", "customStages");
					e.document.unsetFlag("healthEstimate", "customStages");
				}
			}

			const defaultSettings = game.settings.get("healthEstimate", "core.stateNames");
			const tokenSettings = canvas.tokens.controlled[0].document.getFlag("healthEstimate", "customStages");

			new Dialog({
				title: game.i18n.localize("healthEstimate.core.keybinds.customEstimates.name"),
				content: `
				Stages: <input id="defaultStages" type="text" disabled value="${defaultSettings}" />
				<p>Custom Stages: <input id="customStages" type="text" value="${tokenSettings || defaultSettings}" />
				`,
				buttons: {
					affectActors: {
						label: game.i18n.localize("healthEstimate.core.keybinds.customEstimates.options.1"),
						callback: (html) => {
							const value = html.find("input#customStages").val();
							if (value) setFlags(value, true);
							else unsetFlags(true);
						},
					},
					affectTokens: {
						label: game.i18n.localize("healthEstimate.core.keybinds.customEstimates.options.2"),
						callback: (html) => {
							const value = html.find("input#customStages").val();
							if (value) setFlags(value);
							else unsetFlags();
						},
					},
				},
				default: "affectActors",
			}).render(true);
		},
		restricted: true,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});
}
