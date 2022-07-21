const fraction = function (token) {
	const hp = token.actor.system.hp;
	return Math.min(hp.value / hp.max, 1);
};

export { fraction };
