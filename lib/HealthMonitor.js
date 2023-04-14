import { f, sGet, t } from "../module/utils.js";

//Modified code from Health Monitor by jessev14
//License: MIT

export function onRenderChatMessage(app, html, data) {
	if (html.find(".hm_messageheal").length) html.addClass("hm_message hm_messageheal");
	else if (html.find(".hm_messagetaken").length) html.addClass("hm_message hm_messagetaken");
}

export function getCharacters(tokens) {
	for (let token of tokens) {
		if (game.healthEstimate.breakOverlayRender(token)) continue;
		try {
			const fraction = Number(game.healthEstimate.getFraction(token));
			if (typeof fraction != "number" || isNaN(fraction)) continue;
			const { estimate, index } = game.healthEstimate.getStage(token, fraction);
			game.healthEstimate.actorsCurrentHP[token.id] = {
				name: token.document.name || token.name,
				stage: { estimate, index },
				dead: game.healthEstimate.isDead(token, estimate.value),
			};
		} catch (err) {
			console.error(`Health Estimate | Error on function getCharacters(). Token Name: "${token.name}". Type: "${token.document.actor.type}".`, err);
		}
	}
}

export function outputStageChange(token) {
	try {
		const fraction = Number(game.healthEstimate.getFraction(token));
		const { estimate, index } = game.healthEstimate.getStage(token, fraction);
		const actorData = game.healthEstimate.actorsCurrentHP[token.id];
		const oldStage = actorData.stage;
		const isDead = game.healthEstimate.isDead(token, estimate.value);
		if (isDead) estimate.label = game.healthEstimate.deathStateName;
		if (index != oldStage.index || isDead || game.healthEstimate.actorsCurrentHP[token.id].dead != isDead) {
			if (!token.document.getFlag("healthEstimate", "hideHealthEstimate")) {
				let name = actorData.name;
				if (game.cub && game.cub.hideNames.shouldReplaceName(token.actor)) {
					name = game.cub.hideNames.getReplacementName(token.actor);
				} else if (
					game.modules.get("xdy-pf2e-workbench")?.active &&
					game.settings.get("xdy-pf2e-workbench", "npcMystifier") &&
					game.settings.get("healthEstimate", "PF2E.workbenchMystifier") &&
					token.name !== (token?.actor?.prototypeToken.name ?? "") &&
					!token.actor.hasPlayerOwner
				) {
					name = token?.name;
				} else if (token.document.getFlag("healthEstimate", "hideName") && [0, 10, 20, 40].includes(token.document.displayName) && !token.actor.hasPlayerOwner) {
					name = sGet("core.unknownEntity");
				}
				const css = index > oldStage.index ? "<span class='hm_messageheal'>" : "<span class='hm_messagetaken'>";
				// Check if Description isn't empty and is different from the former, for the case where
				// the same stage is used for different fractions e.g. "Unconscious, Bloodied, Hurt, Hurt, Injured"
				if (estimate.label && estimate.label != oldStage.estimate.label) {
					const chatData = {
						content: css + f("core.isNow", { name, desc: estimate.label }) + "</span>",
					};
					ChatMessage.create(chatData, {});
				}
			}
			game.healthEstimate.actorsCurrentHP[token.id].stage = { estimate, index };
			game.healthEstimate.actorsCurrentHP[token.id].dead = isDead;
		}
	} catch (err) {
		console.error(`Health Estimate | Error on outputStageChange(). Token Name: "${token.name}". Type: "${token.document.actor.type}".`, err);
	}
}
