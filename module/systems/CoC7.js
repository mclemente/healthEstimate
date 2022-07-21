const fraction = function (token) {
	const hp = token.actor.system.attribs.hp;
	if (hp.max > 0) {
		return hp.value / hp.max;
	}
	return 0;
};

const breakCondition = `
	|| token.actor.type === 'container'`;

export { fraction, breakCondition };
