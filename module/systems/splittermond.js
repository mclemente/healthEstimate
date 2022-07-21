const fraction = function (token) {
	const hp = token.actor.system.health;

	return hp.total.value / hp.max;
};

export { fraction };
