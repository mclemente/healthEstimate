const fraction = function (token) {
	const stun     = token.actor.data.data.track.stun
	const physical = token.actor.data.data.track.physical
	return Math.min(
		(stun.max - stun.value) / stun.max,
		(physical.max - physical.value) / physical.max
	)
}

export {fraction}