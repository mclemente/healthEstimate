import { HealthEstimateHooks } from "./hooks.js";
import { HealthEstimate } from "./logic.js";
import { f, t } from "./utils.js";

Hooks.once("i18nInit", function () {
	setKeybinds();
	game.healthEstimate = new HealthEstimate();
	addTokenConfigTab(foundry.applications.sheets.TokenConfig);
	addTokenConfigTab(foundry.applications.sheets.PrototypeTokenConfig, "actor");
});

Hooks.once("setup", () => game.healthEstimate.setup());
Hooks.once("ready", () => game.healthEstimate.ready());

// Canvas
Hooks.once("canvasReady", HealthEstimateHooks.onceCanvasReady);
Hooks.on("combatStart", HealthEstimateHooks.onCombatStart);
Hooks.on("updateCombat", HealthEstimateHooks.onUpdateCombat);
Hooks.on("deleteCombat", HealthEstimateHooks.onUpdateCombat);
Hooks.on("canvasReady", HealthEstimateHooks.onCanvasReady);
Hooks.on("3DCanvasSceneReady", () => setTimeout(HealthEstimateHooks.onCanvasReady, 10));
Hooks.on("createToken", HealthEstimateHooks.onCreateToken);

// Actor
Hooks.on("updateActor", HealthEstimateHooks.onUpdateActor);
Hooks.on("deleteActor", HealthEstimateHooks.deleteActor);
Hooks.on("deleteActiveEffect", HealthEstimateHooks.deleteActiveEffect);

// Rendering
Hooks.on("renderChatMessage", HealthEstimateHooks.onRenderChatMessage);
Hooks.on("renderSettingsConfig", HealthEstimateHooks.renderSettingsConfigHandler);

function setKeybinds() {
	game.keybindings.register("healthEstimate", "markDead", {
		name: "healthEstimate.core.keybinds.markDead.name",
		hint: "healthEstimate.core.keybinds.markDead.hint",
		onDown: () => {
			if (!canvas.tokens?.controlled) return;
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
			if (!canvas.tokens?.controlled) return;
			for (let e of canvas.tokens.controlled) {
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
			if (!canvas.tokens?.controlled) return;
			for (let e of canvas.tokens.controlled) {
				let hidden = !e.document.getFlag("healthEstimate", "hideHealthEstimate");
				e.document.setFlag("healthEstimate", "hideHealthEstimate", hidden);

				const term = hidden
					? game.i18n.localize("healthEstimate.notifications.hidden.singular")
					: game.i18n.localize("healthEstimate.notifications.shown.singular");
				const notification = game.i18n.format("healthEstimate.notifications.toggleEstimate", {
					tokenName: e.actor.name,
					term,
				});
				ui.notifications.info(notification, { console: false });
			}
		},
		restricted: true,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});
	game.keybindings.register("healthEstimate", "hideNames", {
		name: "healthEstimate.core.keybinds.hideNames.name",
		hint: f("core.keybinds.hideNames.hint", { setting: t("core.outputChat.name") }),
		onDown: () => {
			if (!canvas.tokens?.controlled) return;
			for (let e of canvas.tokens.controlled) {
				let hidden = !e.document.getFlag("healthEstimate", "hideName");
				e.document.setFlag("healthEstimate", "hideName", hidden);

				const term = hidden
					? game.i18n.localize("healthEstimate.notifications.hidden.singular")
					: game.i18n.localize("healthEstimate.notifications.shown.singular");
				const notification = game.i18n.format("healthEstimate.notifications.toggleName", {
					tokenName: e.actor.name,
					term,
				});
				ui.notifications.info(notification, { console: false });
			}
		},
		restricted: true,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});
	game.keybindings.register("healthEstimate", "hideEstimatesAndNames", {
		name: "healthEstimate.core.keybinds.hideEstimatesAndNames.name",
		hint: "healthEstimate.core.keybinds.hideEstimatesAndNames.hint",
		onDown: () => {
			if (!canvas.tokens?.controlled) return;
			for (let e of canvas.tokens.controlled) {
				let hidden =
					!e.document.getFlag("healthEstimate", "hideHealthEstimate")
					&& !e.document.getFlag("healthEstimate", "hideName");
				e.document.setFlag("healthEstimate", "hideHealthEstimate", hidden);
				e.document.setFlag("healthEstimate", "hideName", hidden);

				const term = hidden
					? game.i18n.localize("healthEstimate.notifications.hidden.plural")
					: game.i18n.localize("healthEstimate.notifications.shown.plural");
				const notification = game.i18n.format("healthEstimate.notifications.toggleEstimateName", {
					tokenName: e.actor.name,
					term,
				});
				ui.notifications.info(notification, { console: false });
			}
		},
		restricted: true,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});
}

function addTokenConfigTab(cls, document = "document") {
	// We need to make sure the Health Estimate tab renders before the footer
	cls.TABS.sheet.tabs.push({ id: "healthEstimate", label: game.i18n.localize("healthEstimate.core.estimates.plural"), icon: "fas fa-scale-balanced" });
	const footerPart = cls.PARTS.footer;
	delete cls.PARTS.footer;
	cls.PARTS.healthEstimate = {
		template: "modules/healthEstimate/templates/token-config.html"
	};
	cls.PARTS.footer = footerPart;

	cls.prototype._prepareHealthestimateTab = async function (partId, context, options) {
		const tokenFlags = this[document].flags?.healthEstimate;
		return {
			hasPlayerOwner: this[document].hasPlayerOwner,
			hideHealthEstimate: tokenFlags?.hideHealthEstimate ? "checked" : "",
			hideName: tokenFlags?.hideName ? "checked" : "",
			dontMarkDead: tokenFlags?.dontMarkDead ? "checked" : "",
			dontMarkDeadHint: f("core.keybinds.dontMarkDead.hint", { setting: t("core.NPCsJustDie.name") }),
			hideNameHint: f("core.keybinds.hideNames.hint", { setting: t("core.outputChat.name") }),
		};
	};
}
