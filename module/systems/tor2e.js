const fraction = function (token) {
	switch (token.actor.type) {
		case "character": {
			const hp = token.actor.system.resources.endurance;
			return hp.value / hp.max;
		}
		case "adversary": {
			const hp = token.actor.system.endurance;
			return hp.value / hp.max;
		}
		case "npc": {
			const hp = token.actor.system.endurance;
			return hp.value / hp.max;
		}
	}
};

export { fraction };
