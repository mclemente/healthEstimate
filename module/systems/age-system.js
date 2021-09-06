const fraction = function (token) {
	const hp = token.actor.data.data.health;
	return hp.value / hp.max;
};

export { fraction };
