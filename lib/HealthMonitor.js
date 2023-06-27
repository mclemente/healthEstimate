import { f, sGet, t } from "../module/utils.js";

//Modified code from Health Monitor by Jesse Vo (jessev14)
//License: MIT

export function onRenderChatMessage(app, html, data) {
	if (html.find(".hm_messageheal").length) html.addClass("hm_message hm_messageheal");
	else if (html.find(".hm_messagetaken").length) html.addClass("hm_message hm_messagetaken");
}

/**
 *
 * @param {Token} token
 */
function getActorHealth(token) {
	try {
		const fraction = Number(game.healthEstimate.getFraction(token));
		if (!Number.isNumeric(fraction)) return;

		const { estimate, index } = game.healthEstimate.getStage(token, fraction);
		const isDead = game.healthEstimate.isDead(token, estimate.value);
		if (isDead) estimate.label = game.healthEstimate.deathStateName;

		return { estimate, index, isDead };
	} catch (err) {
		console.error(`Health Estimate | Error on function getActorHealth(). Token Name: "${token.name}". ID: "${token.id}". Type: "${token.document.actor.type}".`, err);
		return null;
	}
}

/**
 *
 * @param {Token} token
 */
export function addCharacter(token) {
	if (game.healthEstimate.breakOverlayRender(token)) return;
	const { estimate, index, isDead } = getActorHealth(token);
	game.healthEstimate.actorsCurrentHP[token.id] = {
		name: token.document.name || token.name,
		stage: { estimate, index },
		dead: isDead,
	};
}

/**
 *
 * @param {Token} token
 */
export function outputStageChange(token) {
	// Get the last data state
	const actorData = game.healthEstimate.actorsCurrentHP[token.id];
	const oldStage = actorData.stage;

	// Get the new data state
	const { estimate, index, isDead } = getActorHealth(token);

	// Update data state if needed
	if (index != oldStage.index || isDead || actorData.dead != isDead) {
		actorData.stage = { estimate, index };
		actorData.dead = isDead;
	}

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

	// Prevent multi post of chat message if multiple GMs are logged in
	if ( !game.users.activeGM?.isSelf ) return;
	// Output change if label isn't empty and is different from the last, for the case where
	// the same stage is used for different fractions e.g. "Unconscious, Bloodied, Hurt, Hurt, Injured"
	if (estimate.label && estimate.label != oldStage.estimate.label) {
		const chatData = {
			content: css + f("core.isNow", { name, desc: estimate.label }) + "</span>",
		};
		ChatMessage.create(chatData, {});
	}
}
