const fraction = (token) => {
	const hp = token.actor.system.derived.hp;
	return hp.value / hp.max;
};

const settings = () => {
	return {
		"core.breakOnZeroMaxHP": {
			type: Boolean,
			default: true,
		},
		"core.stateNames": {
			config: true,
			scope: "world",
			type: String,
			default: t("starfinder.vehicleNames.default"),
		},
	};
};

const breakCondition = `
	|| game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') 
	&& (token.actor.system.mech?.hp.max === 0
	|| token.actor.system.hp?.max    === 0)
`;

export { fraction, settings, breakCondition };
