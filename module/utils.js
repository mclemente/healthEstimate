/**
 * Check whether the entry is an empty string or a falsey value
 * @param string
 * @returns {boolean}
 */
export function isEmpty (string) {
	return !string || string.length === 0 || /^\s*$/.test(string)
}

 /**
 * Function handling which description to show. Overrides systemSpecifics.js's descriptionToShow.
 * @param {String[]} descriptions
 * @param {Number} stage
 * @param {Token} token
 * @param state
 * @returns {*}
 */
export let descriptions = function (descriptions, stage, token, state = {isDead: false, desc: ''}, fraction) {
	if (state.isDead) {
		return state.desc;
	}
	const type = token.actor.data.type;
	if (type === 'vehicle') {
		if (game.settings.get('healthEstimate', 'starfinder.useThreshold')) {
			descriptions = game.settings.get('healthEstimate', 'starfinder.thresholdNames').split(/[,;]\s*/);
		}
		else {
			descriptions = game.settings.get('healthEstimate', 'starfinder.vehicleNames').split(/[,;]\s*/);
		}
		stage = Math.max(0, Math.ceil((descriptions.length - 1) * fraction));
	}
	return descriptions[stage];
}

/**
 * Shorthand for localization
 * @param key
 * @returns {string}
 */
export function t (key) {
	return game.i18n.localize(`healthEstimate.${key}`)
}

/**
 * Shorthand for game.settings.set
 * @param {string} key
 * @param value
 */
export function sSet (key, value) {
	game.settings.set('healthEstimate', key, value)
}

/**
 * Shorthand for game.settings.get
 * @param {string} key
 * @returns {any}
 */
export function sGet (key) {
	return game.settings.get('healthEstimate', key)
}

/**
 * Returns a setting Object
 * @param key
 * @returns {Object}
 */
export function settingData(key) {
	return game.settings.settings.get(`healthEstimate.${key}`)
}