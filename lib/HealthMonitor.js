import { t } from "../module/utils.js";

//Modified code from Health Monitor by jessev14
//License: MIT

export function onRenderChatMessage(app, html, data) {
	if (html.find(".hm_messageheal").length) {
		html.addClass("hm_message hm_messageheal");
		// html.find(".message-sender").text("");
		// html.find(".message-metadata")[0].style.display = "none";
	}
	if (html.find(".hm_messagetaken").length) {
		html.addClass("hm_message hm_messagetaken");
		// html.find(".message-sender").text("");
		// html.find(".message-metadata")[0].style.display = "none";
	}
}

export function getCharacters(actors) {
	for (let actor of actors) {
		if (game.healthEstimate.breakOverlayRender(actor)) continue;
		try {
			const fraction = game.healthEstimate.getFraction(actor);
			if (typeof fraction != "number" || isNaN(fraction)) continue;
			const stage = game.healthEstimate.getStage(fraction);
			game.healthEstimate.actorsCurrentHP[actor.id] = { name: actor.document.name || actor.name, stage: stage, dead: game.healthEstimate.isDead(actor, stage) };
		} catch (err) {
			console.error(`Health Estimate | Error on function getCharacters(). Token Name: "${actor.name}". Type: "${actor.document.actor.type}".`, err);
		}
	}
}

export function outputStageChange(token) {
	try {
		const fraction = game.healthEstimate.getFraction(token);
		const stage = game.healthEstimate.getStage(fraction);
		const dead = game.healthEstimate.isDead(token, stage);
		if (stage != game.healthEstimate.actorsCurrentHP[token.id].stage || dead != game.healthEstimate.actorsCurrentHP[token.id].dead) {
			let name = game.healthEstimate.actorsCurrentHP[token.id].name;
			if (
				(token.document.getFlag("healthEstimate", "hideName") || token.document.getFlag("healthEstimate", "hideHealthEstimate")) &&
				[0, 10, 20, 40].includes(token.document.displayName) &&
				!token.actor.hasPlayerOwner
			) {
				name = game.i18n.localize("healthEstimate.core.unknownEntity");
			}
			let css = stage > game.healthEstimate.actorsCurrentHP[token.id].stage ? "<span class='hm_messageheal'>" : "<span class='hm_messagetaken'>";
			let desc = game.healthEstimate.descriptionToShow(
				game.healthEstimate.descriptions,
				stage,
				token,
				{
					isDead: dead,
					desc: game.healthEstimate.deathStateName,
				},
				fraction
			);
			let chatData = {
				content: css + name + " " + t("core.isNow") + " " + desc + ".</span>",
			};
			ChatMessage.create(chatData, {});
			game.healthEstimate.actorsCurrentHP[token.id].stage = stage;
			game.healthEstimate.actorsCurrentHP[token.id].dead = dead;
		}
	} catch (err) {
		console.error(`Health Estimate | Error on outputStageChange(). Token Name: "${token.name}". Type: "${token.document.actor.type}".`, err);
	}
}
