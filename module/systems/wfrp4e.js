const fraction = function (token) {
	const hp = token.actor.data.data.status.wounds
	return hp.value / hp.max
}

export {fraction}