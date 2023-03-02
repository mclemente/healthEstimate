import { f, sGet, t } from "../utils.js";

const fraction = function (token) {
	const hp = token.actor.system.wounds;
	let maxHP = Math.max(hp.max, 1);
	if (token.actor.system.wildcard) {
		const defaultWildCardMaxWounds = sGet("swade.defaultWildCardMaxWounds");
		maxHP = 1 + Math.max(hp.max || defaultWildCardMaxWounds, 1);
	}
	return (maxHP - hp.value) / maxHP;
};

const descriptions = function (descriptions, stage, token, state = { dead: false, desc: "" }, fraction) {
	if (token.actor.type == "vehicle") {
		descriptions = game.settings.get("healthEstimate", "starfinder.vehicleNames").split(/[,;]\s*/);
		stage = Math.max(0, Math.ceil((descriptions.length - 1) * fraction));
	} else if (state.dead) {
		return state.desc;
	} else if (sGet("swade.showIncap") && token.actor.effects.find((e) => e._statusId == "incapacitated")) return game.i18n.localize("SWADE.Incap");
	return descriptions[stage];
};

const tokenEffects = function (token) {
	return token.document.overlayEffect === game.healthEstimate.deathMarker;
};

const settings = () => {
	return {
		"swade.defaultWildCardMaxWounds": {
			type: Number,
			default: 3,
			range: {
				min: 1,
				max: 10,
			},
		},
		"starfinder.vehicleNames": {
			type: String,
			default: t("swade.vehicleNames.default"),
			hint: t("swade.vehicleNames.hint"),
		},
		"swade.showIncap": {
			type: Boolean,
			default: true,
			name: f("swade.showIncap.name", { incap: game.i18n.localize("SWADE.Incap") }),
			hint: f("swade.showIncap.hint", { incap: game.i18n.localize("SWADE.Incap") }),
		},
	};
};

export { descriptions, fraction, settings, tokenEffects };
