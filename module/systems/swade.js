import { descriptions, sGet, t } from "../utils.js";

const fraction = function (token) {
	const hp = token.actor.system.wounds;
	let maxHP = Math.max(hp.max, 1);
	if (token.actor.system.wildcard) {
		const defaultWildCardMaxWounds = sGet("swade.defaultWildCardMaxWounds");
		maxHP = 1 + Math.max(hp.max || defaultWildCardMaxWounds, 1);
	}
	return (maxHP - hp.value) / maxHP;
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
	};
};

export { descriptions, fraction, settings, tokenEffects };
