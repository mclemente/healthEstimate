const fraction = function (token) {
	switch (token.actor.data.type) {
		case "character": {
			const hp = token.actor.data.data.resources.endurance;
			return hp.value / hp.max;
		}
		case "adversary": {
			const hp = token.actor.data.data.endurance;
			return hp.value / hp.max;
		}
		case "npc": {
			const hp = token.actor.data.data.endurance;
			return hp.value / hp.max;
		}
	}
};

export { fraction };
