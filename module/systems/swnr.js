const fraction = function (token) {
	const hp = token.actor.data.data.health;
	return Math.min(hp.value / hp.max, 1);
};

export { fraction };
