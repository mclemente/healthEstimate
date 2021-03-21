const fraction = function (token) {
	const hp = token.actor.data.data.wounds
	return (hp.max - hp.value) / hp.max
}

export {fraction}