const fraction = function (token) {
	const hp = token.actor.data.data.attrTop.hp || token.actor.data.data.attrLeft.hp || token.actor.data.data.attrTop.harm || token.actor.data.data.attrLeft.harm;
	if (hp.type == "Resource") return hp.value / hp.max;
	else return (hp.max - hp.value) / hp.max;
};

export { fraction };
