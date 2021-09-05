import { registerSettings } from "./module/settings.js";
import { preloadTemplates } from "./module/preloadTemplates.js";
import { prepareSystemSpecifics } from "./module/systemSpecifics.js";
import { HealthEstimate, getCharacters, outputChat, outputStageChange, updateSettings } from "./module/logic.js";

/**
 * Preload templates and add it template to the HUD
 */
Hooks.once("init", async function () {
	await preloadTemplates();
	Hooks.on("renderHeadsUpDisplay", (app, html, data) => {
		html.append('<template id="healthEstimate"></template>');
	});
});

/**
 * Have to register Settings here, because doing so at init breaks i18n
 */
Hooks.once("setup", function () {
	prepareSystemSpecifics().then(registerSettings());
});

Hooks.once("ready", function () {
	// new HealthEstimate();
});

/**
 * HP storing code for canvas load or token created
 */
Hooks.on("canvasReady", function () {
	new HealthEstimate();
	let tokens = canvas.tokens.placeables.filter((e) => e.actor);
	updateSettings();
	getCharacters(tokens);
});

Hooks.on("createToken", function () {
	let tokens = canvas.tokens.placeables.filter((e) => e.actor);
	getCharacters(tokens);
});

/**
 * spam in chat if token (NPC) is updated
 * only the USER that promoted the change will spam the message
 * start collectting all PNC hp information
 */
Hooks.on("updateToken", (scene, token, updateData, options, userId) => {
	if (game.user.isGM && outputChat) {
		let actors = canvas.tokens.placeables.filter((e) => e.actor);
		outputStageChange(actors);
	}
});

/**
 * spam in chat if the actor is updated
 * only the USER that promoted the change will spam the message
 * start collectting all PNC hp information
 */
Hooks.on("updateActor", (data, options, apps, userId) => {
	if (game.user.isGM && outputChat) {
		let actors = canvas.tokens.placeables.filter((e) => e.actor && e.actor.data.type === "character");
		outputStageChange(actors);
	}
});

/**
 * Chat Styling
 */
Hooks.on("renderChatMessage", (app, html, data) => {
	if (html.find(".hm_messageheal").length) {
		html.css("background", "#06a406");
		html.css("text-shadow", "-1px -1px 0 #000 , 1px -1px 0 #000 , -1px 1px 0 #000 , 1px 1px 0 #000");
		html.css("color", "white");
		html.css("text-align", "center");
		html.css("font-size", "12px");
		html.css("margin", "2px");
		html.css("padding", "2px");
		html.css("border", "2px solid #191813d6");
		// html.find(".message-sender").text("");
		// html.find(".message-metadata")[0].style.display = "none";
	}
	if (html.find(".hm_messagetaken").length) {
		html.css("background", "#c50d19");
		html.css("text-shadow", "-1px -1px 0 #000 , 1px -1px 0 #000 , -1px 1px 0 #000 , 1px 1px 0 #000");
		html.css("color", "white");
		html.css("text-align", "center");
		html.css("font-size", "12px");
		html.css("margin", "2px");
		html.css("padding", "2px");
		html.css("border", "2px solid #191813d6");
		// html.find(".message-sender").text("");
		// html.find(".message-metadata")[0].style.display = "none";
	}
});
