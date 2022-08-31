const fraction = function (token) {
	const hp = token.actor.system.health;
	return hp.value / hp.max;
};

export { fraction };
