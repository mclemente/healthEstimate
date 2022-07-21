const fraction = function (token) {
	const hp = token.actor.system.health.toughness;
	return hp.value / hp.max;
};

export { fraction };
