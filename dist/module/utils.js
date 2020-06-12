/**
 * Check whether the entry is an empty string or a falsey value
 * @param string
 * @returns {boolean}
 */
export function isEmpty (string) {
	return !string || string.length === 0 || /^\s*$/.test(string)
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