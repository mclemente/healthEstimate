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

export function getCharacters(tokens) {
	for (let token of tokens) {
		if (game.healthEstimate.breakOverlayRender(token)) continue;
		try {
			const fraction = game.healthEstimate.getFraction(token);
			if (typeof fraction != "number" || isNaN(fraction)) continue;
			const stage = game.healthEstimate.getStage(token, fraction);
			game.healthEstimate.actorsCurrentHP[token.id] = { name: token.document.name || token.name, stage: stage, dead: game.healthEstimate.isDead(token, stage) };
		} catch (err) {
			console.error(`Health Estimate | Error on function getCharacters(). Token Name: "${token.name}". Type: "${token.document.actor.type}".`, err);
		}
	}
}

export function outputStageChange(token) {
	try {
		const fraction = game.healthEstimate.getFraction(token);
		const { estimate, index } = game.healthEstimate.getStage(token, fraction);
		const actorData = game.healthEstimate.actorsCurrentHP[token.id];
		const oldStage = actorData.stage;
		const deathStateName = game.healthEstimate.deathStateName;
		if (index != oldStage.index || (estimate.label === deathStateName) != actorData.dead) {
			let name = actorData.name;
			if (
				(token.document.getFlag("healthEstimate", "hideName") || token.document.getFlag("healthEstimate", "hideHealthEstimate")) &&
				[0, 10, 20, 40].includes(token.document.displayName) &&
				!token.actor.hasPlayerOwner
			) {
				name = game.i18n.localize("healthEstimate.core.unknownEntity");
			}
			const css = index > oldStage.index ? "<span class='hm_messageheal'>" : "<span class='hm_messagetaken'>";
			// Check if Description isn't empty and is different from the former, for the case where
			// the same stage is used for different fractions e.g. "Unconscious, Bloodied, Hurt, Hurt, Injured"
			if (estimate.label && estimate.label != oldStage.estimate.label) {
				const chatData = {
					content: css + name + " " + t("core.isNow") + " " + estimate.label + ".</span>",
				};
				ChatMessage.create(chatData, {});
			}
			game.healthEstimate.actorsCurrentHP[token.id].stage = estimate;
			game.healthEstimate.actorsCurrentHP[token.id].dead = estimate.label === deathStateName;
		}
	} catch (err) {
		console.error(`Health Estimate | Error on outputStageChange(). Token Name: "${token.name}". Type: "${token.document.actor.type}".`, err);
	}
}
