const fraction = function (token) {
    const actor = token.actor;
    if (actor.type === 'pc') {
        const pools = actor.system.pools;
        let curr = pools.might.value + pools.speed.value + pools.intellect.value;
        let max  = pools.might.max   + pools.speed.max   + pools.intellect.max;
        // TODO: should we ever include the additional pool in this calculation?
        if (actor.system.settings.general.additionalPool.active) {
            curr += pools.additional.value;
            max  += pools.additional.max;
        }
        if (curr > max) curr = max;
        let result = curr / max;
        let limit = 1.0;

        switch (actor.system.combat.damageTrack.state) {
            case 'Hale':
                break;
            case 'Impaired':
                limit = game.settings.get('healthEstimate', "cyphersystem.impaired");
                break;
            case 'Debilitated':
                limit = game.settings.get('healthEstimate', "cyphersystem.debilitated");
                break;
            default:
                result = 0.0;
        }
        if (result > limit) result = limit;
        return result;
    } else if (actor.system.pools?.health) {
        let hp = actor.system.pools.health;
        return hp.value / hp.max;
    } else {
        return ;
    }
};

// New module configuration settings specific to this module
const settings = () => {
	return {
		"cyphersystem.impaired": {
			type: Number,
			default: 0.5,
		},
		"cyphersystem.debilitated": {
			type: Number,
			default: 0.1,
		},
	};
};

// Only show Health Estimate on the following Actor types
const breakCondition = `|| ![ 'pc', 'npc', 'companion','community' ].includes(token.actor.type)`;

export { fraction, settings, breakCondition };