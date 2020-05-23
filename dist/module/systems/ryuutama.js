const fraction = function (token) {
	const hp = token.actor.data.data.hp
	return hp.value / hp.max
}

export {fraction}