const fraction = function (token) {
	const hp = token.actor.data.data.combat.toughness
	return hp.value / hp.max
}

export {fraction}