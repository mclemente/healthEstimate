const fraction = function (token) {
        let hp = token.actor.data.data.combatValues.hitPoints;
        return hp.value / hp.max;
};

export { fraction };
