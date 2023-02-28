import { t } from "../utils.js";

const fraction = function (token) {
	switch (token.actor.type) {
		case "traveller": {
			const hp = token.actor.system.hits;
			return hp.value / hp.max;
		}
		case "ship": {
			const hp = token.actor.system.ship.shipStats;
			return hp.hullCurrent / hp.hull;
		}
	}
};

const settings = () => {
	return {
		"starfinder.vehicleNames": {
			type: String,
			hint: t("dnd5e.vehicleNames.hint"),
		},
	};
};

const descriptions = function (descriptions, stage, token, state = { dead: false, desc: "" }, fraction) {
	if (token.actor.type === "ship") {
		descriptions = game.settings.get("healthEstimate", "starfinder.vehicleNames").split(/[,;]\s*/);
		stage = Math.max(0, Math.ceil((descriptions.length - 1) * fraction));
		state.desc = descriptions[0];
	}
	if (state.dead) {
		return state.desc;
	}
	return descriptions[stage];
};

export { fraction, settings, descriptions };
