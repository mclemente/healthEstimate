const fraction = function (token) {
	let hp = token.actor.system.combatValues.hitPoints;
	return hp.value / hp.max;
};

export { fraction };
