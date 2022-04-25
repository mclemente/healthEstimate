const fraction = function (token) {
	const hp = token.actor.data.data.attribs.hp;
	if (hp.max > 0) {
		return hp.value / hp.max;
	}
	return 0;
};

const breakCondition = `
	|| token.actor.data.type === 'container'`;

export { fraction, breakCondition };
