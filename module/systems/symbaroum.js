const fraction = function (token) {
	const hp = token.actor.data.data.health.toughness;
	return hp.value / hp.max;
};

export { fraction };
