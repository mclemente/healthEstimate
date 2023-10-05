import { HealthEstimateHooks } from "./module/hooks.js";
import { HealthEstimate } from "./module/logic.js";
import { f, t } from "./module/utils.js";

Hooks.once("i18nInit", function () {
	setKeybinds();
	game.healthEstimate = new HealthEstimate();
});

Hooks.once("setup", function () {
	game.healthEstimate.setup();
});

Hooks.once("ready", function () {
	if (game.settings.get("healthEstimate", "core.outputChat") && game.user.isGM) {
		Hooks.on("updateActor", HealthEstimateHooks.onUpdateActor);
	}
});

//Canvas
Hooks.once("canvasReady", HealthEstimateHooks.onceCanvasReady);
Hooks.on("canvasReady", HealthEstimateHooks.onCanvasReady);
Hooks.on("createToken", HealthEstimateHooks.onCreateToken);

//Actor
Hooks.on("deleteActor", HealthEstimateHooks.deleteActor);
Hooks.on("deleteActiveEffect", HealthEstimateHooks.deleteActiveEffect);

//Rendering
Hooks.on("renderChatMessage", HealthEstimateHooks.onRenderChatMessage);
Hooks.on("renderSettingsConfig", HealthEstimateHooks.renderSettingsConfigHandler);
Hooks.on("renderHealthEstimateStyleSettings", HealthEstimateHooks.renderHealthEstimateStyleSettingsHandler);
Hooks.on("renderTokenConfig", HealthEstimateHooks.renderTokenConfigHandler);

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
				if (hidden)
					ui.notifications.info(`${e.actor.name}'s health estimate is hidden from players.`, {
						console: false,
					});
				else
					ui.notifications.info(`${e.actor.name}'s health estimate is shown to players.`, { console: false });
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
				let hidden =
					!e.document.getFlag("healthEstimate", "hideHealthEstimate") &&
					!e.document.getFlag("healthEstimate", "hideName");
				e.document.setFlag("healthEstimate", "hideHealthEstimate", hidden);
				e.document.setFlag("healthEstimate", "hideName", hidden);
				if (hidden)
					ui.notifications.info(`${e.actor.name}'s health estimate and name are hidden from players.`, {
						console: false,
					});
				else
					ui.notifications.info(`${e.actor.name}'s health estimate and name are shown to players.`, {
						console: false,
					});
			}
		},
		restricted: true,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});
}
