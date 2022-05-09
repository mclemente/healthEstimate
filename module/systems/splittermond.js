const fraction = function (token) {
	const hp = token.actor.data.data.health;

    return (hp.max - hp.total.value) / hp.max;
};

export { fraction };
