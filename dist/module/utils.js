/**
 * Check whether the entry is an empty string or a falsey value
 * @param string
 * @returns {boolean}
 */
export function isEmpty(string) {
	return !string || string.length === 0 || /^\s*$/.test(string)
}

/**
 * Shorthand for localization
 * @param key
 * @returns {string}
 */
export function t(key) {
	return game.i18n.localize(`healthEstimate.${key}`)
}
