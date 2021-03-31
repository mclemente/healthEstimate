const fraction = function (token) {
	const hp = token.actor.data.data.attributes?.hp || token.actor.data.data.hp;
	return Math.min(hp.value / hp.max, 1)
}

export {fraction}