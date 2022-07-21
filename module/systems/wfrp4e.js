const fraction = function (token) {
	const hp = token.actor.system.status.wounds;
	return hp.value / hp.max;
};

export { fraction };
