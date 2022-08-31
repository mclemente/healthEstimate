import { vehicleType, starshipType } from "./systemSpecifics.js";

export const REG = {
	// searches if the string is one path
	path: new RegExp(/^([\w_-]+\.)*([\w_-]+)$/),
};

/**
 * Shorthand for game.settings.register().
 * Default data: {scope: "world", config: true}
 * @function addSetting
 * @param {string} key
 * @param {object} data
 */
export function addSetting(key, data) {
	const commonData = {
		name: t(`${key}.name`),
		hint: t(`${key}.hint`),
		scope: "world",
		config: true,
	};
	game.settings.register("healthEstimate", key, Object.assign(commonData, data));
}

/**
 * Check whether the entry is an empty string or a falsey value
 * @param string
 * @returns {boolean}
 */
export function isEmpty(string) {
	return !string || string.length === 0 || /^\s*$/.test(string);
}

/**
 * Function handling which description to show. Overrides game.healthEstimate.descriptionToShow.
 * @param {String[]} descriptions
 * @param {Number} stage
 * @param {Token} token
 * @param state
 * @returns {String}
 */
export let descriptions = function (descriptions, stage, token, state = { dead: false, desc: "" }, fraction, customStages) {
	if (state.dead) {
		return state.desc;
	}
	const type = token.actor.type;
	if ([vehicleType, starshipType].includes(type)) {
		descriptions = game.settings.get("healthEstimate", "starfinder.vehicleNames").split(/[,;]\s*/);
		stage = Math.max(0, Math.ceil((descriptions.length - 1) * fraction));
	}
	return descriptions[stage];
};

/**
 * Shorthand for localization
 * @param {string} key
 * @returns {string}
 */
export function t(key) {
	return game.i18n.localize(`healthEstimate.${key}`);
}

// extracts data from an object, and a string path,
// it has no depth search limit
export function getNestedData(data, path) {
	if (!REG.path.test(path)) {
		return null;
	}
	const paths = path.split(".");
	if (!paths.length) {
		return null;
	}
	let res = data;
	for (let i = 0; i < paths.length; i += 1) {
		if (res === undefined) {
			return null;
		}
		res = res?.[paths[i]];
	}
	return res;
}

/**
 * Shorthand for game.settings.set
 * @param {string} key
 * @param value
 */
export function sSet(key, value) {
	game.settings.set("healthEstimate", key, value);
}

/**
 * Shorthand for game.settings.get
 * @param {string} key
 * @returns {any}
 */
export function sGet(key) {
	return game.settings.get("healthEstimate", key);
}

/**
 * Returns a setting Object
 * @param {string} key
 * @returns {Object}
 */
export function settingData(key) {
	return game.settings.settings.get(`healthEstimate.${key}`);
}
