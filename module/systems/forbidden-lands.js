const fraction = function (token) {
	switch (token.actor.type) {
		case "character":
		case "monster":
			const hp = token.actor.system.attribute.strength;
			return Math.min(hp.value / hp.max, 1);
		default:
			return;
	}
};

const breakCondition = `|| token.actor.type === "party" || token.actor.type === "stronghold"`;

export { fraction, breakCondition };
