const fraction = function (token) {
	let hp = token.actor.system.status.wounds;
	return hp.value / hp.max;
};
const tokenEffects = function (token) {
	return token.document.overlayEffect === game.healthEstimate.deathMarker;
};

export { fraction, tokenEffects };
