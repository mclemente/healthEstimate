import { breakOverlayRender, descriptionToShow, fractionFormula, tokenEffectsPath, updateBreakSettings } from "./systemSpecifics.js";
import { sGet, t } from "./utils.js";

/**
 * Setting variables to avoid multiple game.settings.get() calls since the module checks for the settings on token interactions.
 */
export let alwaysShow,
	deathMarker,
	outputChat,
	current_hp_actor = {}; //store hp of PC

let alignment, colors, deadColor, deadOutline, deathStateName, descriptions, NPCsJustDie, outline, margin, perfectionism, showDead, smooth, useColor;

export function getCharacters(actors) {
	for (let actor of actors) {
		if (breakOverlayRender(actor)) continue;
		try {
			const fraction = getFraction(actor);
			if (typeof fraction != "number" || isNaN(fraction)) continue;
			const stage = getStage(fraction);
			current_hp_actor[actor.id] = { name: actor.document.name || actor.name, stage: stage, dead: isDead(actor, stage) };
		} catch (err) {
			console.error(`Health Estimate | Error on getCharacters(). Token Name: %o. Type: %o`, actor.name, actor.document.actor.type, err);
		}
	}
}

export function outputStageChange(token) {
	try {
		const fraction = getFraction(token);
		const stage = getStage(fraction);
		const dead = isDead(token, stage);
		if (stage != current_hp_actor[token.id].stage || dead != current_hp_actor[token.id].dead) {
			let name = current_hp_actor[token.id].name;
			if (
				(token.document.getFlag("healthEstimate", "hideName") || token.document.getFlag("healthEstimate", "hideHealthEstimate")) &&
				[0, 10, 20, 40].includes(token.document.displayName) &&
				!token.actor.hasPlayerOwner
			) {
				name = "Unknown entity";
			}
			let css = "<span class='hm_messagetaken'>";
			if (stage > current_hp_actor[token.id].stage) {
				css = "<span class='hm_messageheal'>";
			}
			let desc = descriptionToShow(
				descriptions,
				stage,
				token,
				{
					isDead: dead,
					desc: deathStateName,
				},
				fraction
			);
			let chatData = {
				content: css + name + " " + t("core.isNow") + " " + desc + ".</span>",
			};
			ChatMessage.create(chatData, {});
			current_hp_actor[token.id].stage = stage;
			current_hp_actor[token.id].dead = dead;
		}
	} catch (err) {
		console.error(`Health Estimate | Error on outputStageChange(). Token Name: %o. Type: %o`, token.name, token.document.actor.type, err);
	}
}

/**
 * Returns if a token is dead.
 * A token is dead if:
 * (a) is a NPC at 0 HP and the NPCsJustDie setting is enabled
 * (b) has been set as dead in combat (e.g. it has the skull icon, icon may vary from system to system) and the showDead setting is enabled
 * (c) has the healthEstimate.dead flag, which is set by a macro.
 * @param {TokenDocument} token
 * @param {Integer} stage
 * @returns {Boolean}
 */
export function isDead(token, stage) {
	return (
		(NPCsJustDie && !token.actor.hasPlayerOwner && stage === 0 && !token.document.getFlag("healthEstimate", "treatAsPC")) ||
		(showDead && tokenEffectsPath(token)) ||
		token.document.getFlag("healthEstimate", "dead") ||
		false
	);
}

/**
 * Returns the current health fraction of the token.
 * @param {TokenDocument} token
 * @returns {Number}
 */
function getFraction(token) {
	return Math.min(fractionFormula(token), 1);
}

/**
 * Returns the current health stage of the token.
 * @param {Number} fraction
 * @returns {Number}
 */
function getStage(fraction, customStages = []) {
	const desc = customStages?.length ? customStages : descriptions;
	return Math.max(0, perfectionism ? Math.ceil((desc.length - 2 + Math.floor(fraction)) * fraction) : Math.ceil((desc.length - 1) * fraction));
}

/**
 * Updates the variables if any setting was changed.
 */
export function updateSettings() {
	alwaysShow = sGet("core.alwaysShow");
	useColor = sGet("core.menuSettings.useColor");
	descriptions = sGet("core.stateNames").split(/[,;]\s*/);
	smooth = sGet("core.menuSettings.smoothGradient");
	deathStateName = sGet("core.deathStateName");
	showDead = sGet("core.deathState");
	NPCsJustDie = sGet("core.NPCsJustDie");
	deathMarker = sGet("core.deathMarker");
	colors = sGet("core.variables.colors");
	outline = sGet("core.variables.outline");
	deadColor = sGet("core.variables.deadColor");
	deadOutline = sGet("core.variables.deadOutline");
	perfectionism = sGet("core.perfectionism");
	outputChat = sGet("core.outputChat");

	alignment = sGet("core.menuSettings.position");
	margin = sGet("core.menuSettings.positionAdjustment");
	document.documentElement.style.setProperty("--healthEstimate-alignment", alignment);
	document.documentElement.style.setProperty("--healthEstimate-margin", `${margin}em`);
	document.documentElement.style.setProperty("--healthEstimate-text-size", sGet("core.menuSettings.fontSize"));
}

export function hideEstimate(token) {
	return token.document.getFlag("healthEstimate", "hideHealthEstimate") || token.actor.getFlag("healthEstimate", "hideHealthEstimate");
}

export class HealthEstimate {
	constructor() {
		updateBreakSettings();
		updateSettings();
		Hooks.on("refreshToken", (token) => {
			this._handleOverlay(token, alwaysShow || token.hover);
		});
		Hooks.on("hoverToken", (token, hovered) => {
			this._handleOverlay(token, alwaysShow || hovered);
		});
		if (alwaysShow) canvas.scene.tokens.forEach((token) => token.object.refresh());
		Hooks.on("updateActor", (data, options, apps, userId) => {
			if (alwaysShow) {
				//Get all the tokens on the off-chance there's two tokens of the same linked actor.
				let tokens = canvas.tokens.placeables.filter((e) => e.actor && data.id == e.actor.id);
				for (let token of tokens) {
					this._handleOverlay(token, true);
				}
			}
		});
		Hooks.on("updateToken", (scene, token, updateData, options, userId) => {
			if (alwaysShow) this._handleOverlay(token, true);
		});
	}

	_handleOverlay(token, hovered) {
		if (!token?.actor) return;
		if (breakOverlayRender(token) || (!game.user.isGM && hideEstimate(token))) return;
		const width = canvas.scene.grid.size * token.document.width;
		document.documentElement.style.setProperty("--healthEstimate-width", `${width}px`);

		if (hovered) {
			if (!token.isVisible) return;
			const { desc, color, stroke } = getEstimation(token);
			if (!desc) return;

			const style = new PIXI.TextStyle({
				fontSize: document.documentElement.style.getPropertyValue("--healthEstimate-text-size"),
				fill: color,
				stroke: stroke,
				strokeThickness: 3,
			});
			if (token.healthEstimate) token.healthEstimate.destroy();
			token.healthEstimate = token.addChild(
				new PIXI.Text(desc, {
					fontSize: document.documentElement.style.getPropertyValue("--healthEstimate-text-size"),
					fill: color,
					stroke: stroke,
					strokeThickness: 3,
				})
			);

			const gridSize = canvas.scene.grid.size;
			const tokenHeight = token.document.height;
			token.healthEstimate.anchor.x = 0.5;
			token.healthEstimate.anchor.y = margin;
			token.healthEstimate.x = Math.floor(width / 2);
			switch (alignment) {
				case "start":
					token.healthEstimate.y = -Math.floor((gridSize / 2) * tokenHeight);
					break;
				case "center":
					break;
				case "end":
					token.healthEstimate.y = Math.floor((gridSize * tokenHeight) / 2);
					break;
				default:
					console.error("Alignment isn't supposed to be of value %o", alignment);
			}
		} else {
			if (token.healthEstimate) token.healthEstimate.visible = false;
		}
	}
}

function getEstimation(token) {
	try {
		const fraction = getFraction(token);
		if (perfectionism == 2 && fraction == 1) return;
		let customStages = token.document.getFlag("healthEstimate", "customStages") || token.actor.getFlag("healthEstimate", "customStages") || "";
		if (customStages.length) customStages = customStages.split(/[,;]\s*/);
		const stage = getStage(fraction, customStages || []);
		const colorIndex = Math.max(0, Math.ceil((colors.length - 1) * fraction));

		let desc = descriptionToShow(
			customStages.length ? customStages : descriptions,
			stage,
			token,
			{
				isDead: isDead(token, stage),
				desc: deathStateName,
			},
			fraction,
			customStages.length ? true : false
		);
		let color = colors[colorIndex];
		let stroke = outline[colorIndex];
		if (isDead(token, stage)) {
			color = deadColor;
			stroke = deadOutline;
		}
		document.documentElement.style.setProperty("--healthEstimate-stroke-color", stroke);
		document.documentElement.style.setProperty("--healthEstimate-text-color", color);
		if (hideEstimate(token)) desc += "*";
		return { desc, color, stroke };
		// canvas.hud.HealthEstimate.estimation = { desc };
	} catch (err) {
		console.error(`Health Estimate | Error on getEstimation(). Token Name: %o. Type: %o`, token.name, token.document.actor.type, err);
	}
}
