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
		const descriptions = game.healthEstimate.descriptions;
		const fraction = game.healthEstimate.getFraction(token);
		const stage = game.healthEstimate.getStage(fraction);
		const oldStage = game.healthEstimate.actorsCurrentHP[token.id].stage;
		const deathStateName = game.healthEstimate.deathStateName;
		const state = {
			dead: game.healthEstimate.isDead(token, stage),
			desc: deathStateName,
		};
		const oldState = {
			dead: game.healthEstimate.actorsCurrentHP[token.id].dead,
			desc: deathStateName,
		};
		if (stage != oldStage || state.dead != game.healthEstimate.actorsCurrentHP[token.id].dead) {
			let name = game.healthEstimate.actorsCurrentHP[token.id].name;
			if (
				(token.document.getFlag("healthEstimate", "hideName") || token.document.getFlag("healthEstimate", "hideHealthEstimate")) &&
				[0, 10, 20, 40].includes(token.document.displayName) &&
				!token.actor.hasPlayerOwner
			) {
				name = game.i18n.localize("healthEstimate.core.unknownEntity");
			}
			const css = stage > oldStage ? "<span class='hm_messageheal'>" : "<span class='hm_messagetaken'>";
			const desc = game.healthEstimate.descriptionToShow(descriptions, stage, token, state, fraction);
			const oldDesc = game.healthEstimate.descriptionToShow(descriptions, oldStage, token, oldState, fraction);
			// Check if Description isn't empty and is different from the former, for the case where
			// the same stage is used for different fractions e.g. "Unconscious, Bloodied, Hurt, Hurt, Injured"
			if (desc && desc != oldDesc) {
				const chatData = {
					content: css + name + " " + t("core.isNow") + " " + desc + ".</span>",
				};
				ChatMessage.create(chatData, {});
			}
			game.healthEstimate.actorsCurrentHP[token.id].stage = stage;
			game.healthEstimate.actorsCurrentHP[token.id].dead = state.dead;
		}
	} catch (err) {
		console.error(`Health Estimate | Error on outputStageChange(). Token Name: "${token.name}". Type: "${token.document.actor.type}".`, err);
	}
}
