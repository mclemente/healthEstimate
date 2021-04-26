const fraction = function (token) {
	const hp = token.actor.data.data.attribs.hp
	if (hp.max > 0) {
		return hp.value / hp.max
	}
	return 0;
}

export {fraction}