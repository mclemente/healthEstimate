import { descriptions, sGet, t } from "../utils.js";

const fraction = function (token) {
	const type = token.actor.type;
	const hp = token.actor.system.wounds;
	switch (type) {
		case "npc":
		case "vehicle":
			if (!token.actor.system.wildcard) {
				var frac = (hp.max - hp.value) / (1 + hp.max);
				break;
			}
		// don't break if NPC is Wild Card
		case "character":
			const defaultWildCardMaxWounds = Math.max(sGet("swade.defaultWildCardMaxWounds"), 0);
			const maxHP = 1 + (hp.max || defaultWildCardMaxWounds);
			frac = (maxHP - hp.value) / maxHP;
			break;
		default:
			console.warn(`Health Estimate | Token "${token.name}" has an unknown type (${token.actor.type}).`);
	}
	if (isNaN(frac)) {
		return 1;
	}
	if (frac == -Infinity) return 0;
	return frac;
};

const tokenEffects = function (token) {
	return token.document.overlayEffect === game.healthEstimate.deathMarker;
};

const settings = () => {
	return {
		"swade.defaultWildCardMaxWounds": {
			type: Number,
			default: 3,
		},
		"starfinder.vehicleNames": {
			type: String,
			default: t("swade.vehicleNames.default"),
			hint: t("swade.vehicleNames.hint"),
		},
	};
};

export { descriptions, fraction, settings, tokenEffects };
