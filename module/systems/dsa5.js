const fraction = function (token) {
	let hp = token.actor.data.data.status.wounds;
	return hp.value / hp.max;
};

export { fraction };
