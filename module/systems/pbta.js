const fraction = function (token) {
	const hp = token.actor.data.data.attrTop.harm || token.actor.data.data.attrLeft.harm;
	return (hp.max - hp.value) / hp.max;
};

export {fraction};