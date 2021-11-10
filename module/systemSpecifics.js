import { isEmpty, sGet } from "./utils.js";
import { addSetting } from "./settings.js";
import { deathMarker } from "./logic.js";

export let fractionFormula;
export let breakOverlayRender;
export let systemSpecificSettings = {};

/**
 * Function handling which description to show. Can be overriden by a system-specific implementation
 * @param {String[]} descriptions
 * @param {Number} stage
 * @param {Token} token
 * @param {object} state
 * @param {Number} fraction
 * @returns {String}
 */
export let descriptionToShow = function (descriptions, stage, token, state = { isDead: false, desc: "" }, fraction) {
	if (state.isDead) {
		return state.desc;
	}
	return descriptions[stage];
};

/**
 * Name of the type of a vehicle.
 * Useful for systems that don't use vehicle as the type's name (e.g. vehicule).
 * It is used in the descriptions (see utils.js).
 */
export let vehicleType = "vehicle";

/**
 * Path of the token's effects.
 * Useful for systems that change how it is handled (e.g. DSA5).
 */
export function tokenEffectsPath(token) {
	return Array.from(token.actor.effects.values()).some((x) => x.data.icon === deathMarker);
}

const tempHPSetting = {
	type: Boolean,
	default: false,
};

let breakConditions = {
	default: `game.keyboard.isDown('Alt')`,
};

function updateBreakConditions() {
	function prep(key) {
		if (isEmpty(breakConditions[key])) {
			return "";
		}
		return breakConditions[key];
	}

	breakOverlayRender = function (token) {
		return new Function(
			`token`,
			`return (
				${prep("default")}
				${prep("onlyGM")} 
				${prep("onlyNotGM")} 
				${prep("onlyNPCs")}
				${prep("onlyPCs")}
				${prep("system")}
			)`
		)(token);
	};
}

/**
 * Changes which users get to see the overlay.
 */
export function updateBreakSettings() {
	breakConditions.onlyGM = sGet("core.showDescription") == 1 ? `|| !game.user.isGM` : ``;
	breakConditions.onlyNotGM = sGet("core.showDescription") == 2 ? `|| game.user.isGM` : ``;

	breakConditions.onlyPCs = sGet("core.showDescriptionTokenType") == 1 ? `|| !token.actor.hasPlayerOwner` : ``;
	breakConditions.onlyNPCs = sGet("core.showDescriptionTokenType") == 2 ? `|| token.actor.hasPlayerOwner` : ``;
	updateBreakConditions();
}

/**
 * Gets system specifics, such as its hp attribute and other settings.
 * currentSystem.settings is a function because doing it otherwise causes l18n calls fire before they're initialized.
 * @returns {Promise}
 */
export function prepareSystemSpecifics() {
	return new Promise((resolve, reject) => {
		// prettier-ignore
		const systems = [
			"age-system", "alienrpg", "archmage", "band-of-blades", "blades-in-the-dark", "CoC7", "D35E", "dnd5e", "dsa5", "dungeonworld", "fate", "foundryvtt-reve-de-dragon",
			"lancer", "monsterweek", "numenera", "ose", "pbta", "pf1", "pf2e", "ryuutama", "scum-and-villainy", "shadowrun5e", "starfinder",
			"starwarsffg", "sw5e", "swade", "symbaroum", "tormenta20", "trpg", "twodsix", "uesrpg-d100", "wfrp4e", "worldbuilding"
		];
		let importString = systems.includes(game.system.id) ? `./systems/${game.system.id}.js` : `./systems/generic.js`;
		import(importString).then((currentSystem) => {
			fractionFormula = currentSystem.fraction;
			if (currentSystem.settings !== undefined) {
				systemSpecificSettings = Object.assign(systemSpecificSettings, currentSystem.settings());
				for (let [key, data] of Object.entries(systemSpecificSettings)) {
					addSetting(key, data);
				}
			}
			if (currentSystem.breakCondition !== undefined) {
				breakConditions["system"] = currentSystem.breakCondition;
			}
			if (currentSystem.descriptions !== undefined) {
				descriptionToShow = currentSystem.descriptions;
			}
			if (currentSystem.tokenEffects !== undefined) {
				tokenEffectsPath = currentSystem.tokenEffects;
			}
			if (currentSystem.vehicleType !== undefined) {
				vehicleType = currentSystem.vehicleType;
			}
			resolve("success");
		});
	});
}
