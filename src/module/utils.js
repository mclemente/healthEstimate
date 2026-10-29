/**
 * Shorthand for game.settings.register().
 * Default data: {scope: "world", config: true}
 * @function addSetting
 * @param {string} key
 * @param {object} data
 */
export function addSetting(key, data) {
	const commonData = {
		name: `healthEstimate.${key}.name`,
		hint: `healthEstimate.${key}.hint`,
		scope: "world",
		config: true,
	};
	game.settings.register("healthEstimate", key, Object.assign(commonData, data));
}

/**
 * Shorthand for game.settings.register().
 * Default data: {scope: "world", config: false}
 * @function addSetting
 * @param {string} key
 * @param {object} data
 */
export function addMenuSetting(key, data) {
	const commonData = {
		name: `healthEstimate.${key}.name`,
		hint: `healthEstimate.${key}.hint`,
		scope: "world",
		config: false,
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
 * Repositions the token's elevation tooltip.
 * @param {Token} token 	The token being refreshed
 * @param {Boolean} force 	Flag that enforces the default position. It is meant to avoid conflict with any modules that change the value.
 */
export function repositionTooltip(token, force = false) {
	const tooltipPosition = game.healthEstimate.tooltipPosition;
	const docWidth = token.document.width;
	const { width } = token.document.getSize();
	const offset = 0.35 / Math.max(1, docWidth);
	if (tooltipPosition === "left") token.tooltip.x = width * (-offset);
	else if (force && tooltipPosition === "default") token.tooltip.x = width / 2;
	else if (tooltipPosition === "right") token.tooltip.x = width * (1 + offset);
}
