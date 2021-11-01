import { deathMarker } from "../logic.js";

const fraction = function (token) {
	let hp = token.actor.data.data.status.wounds;
	return hp.value / hp.max;
};
const tokenEffects = function (token) {
	return token.data.overlayEffect === deathMarker;
};

export { fraction, tokenEffects };
