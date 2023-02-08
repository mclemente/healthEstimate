import { sGet } from "../utils.js";

const fraction = function (token) {
	const hp = token.actor.system.wounds;
	let frac = 0;
	if (token.actor.system.wildcard) {
		const defaultWildCardMaxWounds = Math.max(sGet("swade.defaultWildCardMaxWounds"), 0);
		frac = ((hp.max || defaultWildCardMaxWounds) - hp.value) / (hp.max || defaultWildCardMaxWounds);
	} else frac = (hp.max - hp.value) / hp.max;
	if (isNaN(frac)) {
		return 1;
	}
	if (frac == -Infinity) return 0;
	return frac;
};

const tokenEffects = function (token) {
	return token.document.overlayEffect === game.healthEstimate.deathMarker;
};

const settings = () => {
	return {
		"swade.defaultWildCardMaxWounds": {
			type: Number,
			default: 3,
		},
	};
};

export { fraction, settings, tokenEffects };
