const fraction = function (token) {
	const hp = token.actor.system.attrTop.hp || token.actor.system.attrLeft.hp || token.actor.system.attrTop.harm || token.actor.system.attrLeft.harm;
	if (hp.type == "Resource") return hp.value / hp.max;
	else return (hp.max - hp.value) / hp.max;
};

export { fraction };
