export function isEmpty(string) {
	return !string || string.length === 0 || /^\s*$/.test(string)
}

export function t(key) {
	return game.i18n.localize(`healthEstimate.${key}`)
}
