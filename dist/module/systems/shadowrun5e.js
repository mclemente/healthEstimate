const fraction = function (token) {
	const [stun, physical] = token.actor.data.data.track
	return Math.min(
		(stun.max - stun.value) / stun.max,
		(physical.max - physical.value) / physical.max
	)
}

export {fraction}