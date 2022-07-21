const fraction = function (token) {
	const hp = token.actor.system.hp;
	return hp.value / hp.max;
};

export { fraction };
