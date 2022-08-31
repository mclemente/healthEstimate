const fraction = function (token) {
	const hp = token.actor.system.wounds;
	let frac = (hp.max - hp.value) / hp.max;
	if (isNaN(frac)) {
		frac = 1;
	}
	return frac;
};

export { fraction };
