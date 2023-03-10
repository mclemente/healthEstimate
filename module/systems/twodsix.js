import { t } from "../utils.js";

const fraction = function (token) {
	switch (token.actor.type) {
		case "traveller":
		case "animal": {
			const hp = token.actor.system.hits;
			return hp.value / hp.max;
		}
		case "ship": {
			const hp = token.actor.system.shipStats.hull;
			return hp.value / hp.max;
		}
		case "vehicle": {
			let max = 0;
			let current = 0;
			const status = token.actor.system.systemStatus;
			for (let sys in status) {
				switch (status[sys]) {
					case "operational": {
						max += 2;
						current += 2;
						break;
					}
					case "damaged": {
						max += 2;
						current += 1;
						break;
					}
					case "destroyed": {
						max += 2;
						break;
					}
					case "off": {
						break;
					}
				}
			}
			return current / max;
		}
	}
};

const settings = () => {
	return {
		"starfinder.vehicleNames": {
			type: String,
			default: t("od6s.vehicleNames.default"),
			hint: t("od6.vehicleNames.hint"),
		},
	};
};

const descriptions = function (descriptions, stage, token, state = { dead: false, desc: "" }, fraction) {
	if (token.actor.type === "ship" || token.actor.type === "vehicle") {
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
