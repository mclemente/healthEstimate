const fraction = function (token) {
	const hp = token.actor.data.data.health;

    return hp.total.value / hp.max;
};

export { fraction };
