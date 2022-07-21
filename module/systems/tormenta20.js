const fraction = function (token) {
	const hp = token.actor.system.attributes.pv;
	let temp = 0;
	if (token.actor.type === "character" && game.settings.get("healthEstimate", "core.addTemp")) {
		temp = hp.temp;
	}
	return Math.min((temp + hp.value) / hp.max, 1);
};
const settings = () => {
	return {
		"core.addTemp": {
			type: Boolean,
			default: false,
		},
		"core.breakOnZeroMaxHP": {
			type: Boolean,
			default: true,
		},
	};
};

const breakCondition = `||game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.attributes.pv.max === 0`;

export { fraction, settings, breakCondition };
