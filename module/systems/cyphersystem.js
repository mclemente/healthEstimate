const fraction = function (token) {
    const actor = token.actor;
    if (actor.type === 'pc') {
        switch (actor.system.combat.damageTrack.state) {
            case 'Hale':
                {
                    const pools = actor.system.pools;
                    let curr = pools.might.value + pools.speed.value + pools.intellect.value;
                    let max  = pools.might.max   + pools.speed.max   + pools.intellect.max;
                    // TODO: should we ever include the additional pool in this calculation?
                    if (actor.system.settings.general.additionalPool.active) {
                        curr += pools.additional.value;
                        max  += pools.additional.max;
                    }
                    if (curr > max) curr = max;
                    return curr / max;
                }
            case 'Impaired':
                return 0.66;
            case 'Debilitated':
                return 0.33;
            default:
                return 0;
        }
    } else {
        let hp = actor.system.pools.health;
        return hp.value / hp.max;
    }
};

export { fraction };