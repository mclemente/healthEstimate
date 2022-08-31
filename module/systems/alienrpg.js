const fraction = function (token) {
	const hp = token.actor.system.header.health;
	return hp.value / hp.max;
};

export { fraction };
