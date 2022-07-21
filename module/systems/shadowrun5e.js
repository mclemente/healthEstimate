const fraction = function (token) {
	const stun = token.actor.system.track.stun;
	const physical = token.actor.system.track.physical;
	return Math.min((stun.max - stun.value) / stun.max, (physical.max - physical.value) / physical.max);
};

export { fraction };
