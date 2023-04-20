import { addCharacter, onRenderChatMessage } from "./lib/HealthMonitor.js";
import { HealthEstimate } from "./module/logic.js";
import { onUpdateActor, renderHealthEstimateStyleSettingsHandler, renderSettingsConfigHandler, renderTokenConfigHandler } from "./module/settings.js";
import { f, t } from "./module/utils.js";

/**
 * Have to register Settings here, because doing so at init breaks i18n
 */
Hooks.once("setup", function () {
	setKeybinds();
	game.healthEstimate = new HealthEstimate();
	game.healthEstimate.setup();
	if (game.settings.get("healthEstimate", "core.outputChat") && game.user.isGM) {
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
	/** @type {[Token]} */
	const tokens = canvas.tokens?.placeables.filter((e) => e.actor) ?? [];
	tokens.forEach(addCharacter);
});

Hooks.on("createToken", function (tokenDocument, options, userId) {
	addCharacter(tokenDocument.object);
});

Hooks.on("deleteActor", function (actorDocument, options, userId) {
	let tokens = canvas.tokens?.placeables.filter((e) => e.document.actorId === actorDocument.id);
	tokens.forEach((token) => token.refresh());
});

/**
 * Chat Styling
 */
Hooks.on("renderChatMessage", onRenderChatMessage);

Hooks.on("renderSettingsConfig", renderSettingsConfigHandler);
Hooks.on("renderHealthEstimateStyleSettings", renderHealthEstimateStyleSettingsHandler);
Hooks.on("renderTokenConfig", renderTokenConfigHandler);

Hooks.on("deleteActiveEffect", (activeEffect, options, userId) => {
	if (activeEffect.icon == game.healthEstimate.deathMarker) {
		let tokens = canvas.tokens?.placeables.filter((e) => e.actor && e.actor.id == activeEffect.parent.id);
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
			for (let e of canvas.tokens?.controlled) {
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
			for (let e of canvas.tokens?.controlled) {
				let hasAlive = !e.document.getFlag("healthEstimate", "dontMarkDead");
				e.document.setFlag("healthEstimate", "dontMarkDead", hasAlive);
			}
		},
		restricted: true,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});
	game.keybindings.register("healthEstimate", "hideEstimates", {
		name: "healthEstimate.core.keybinds.hideEstimates.name",
		hint: "healthEstimate.core.keybinds.hideEstimates.hint",
		onDown: () => {
			for (let e of canvas.tokens?.controlled) {
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
			for (let e of canvas.tokens?.controlled) {
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
			for (let e of canvas.tokens?.controlled) {
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
}
