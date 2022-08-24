import { t } from "../utils.js";

const fraction = function (token) {
	const hp = token.actor.system.attributes.hp;
	let temp = 0;
	if (token.actor.type === "vehicle" && game.settings.get("healthEstimate", "starfinder.useThreshold")) {
		if (hp.value > hp.brokenThreshold) {
			return 1;
		} else if (hp.value > 0) {
			return 0.5;
		}
		return 0;
	}
	if (token.actor.type === "loot") {
		return;
	}
	let sp = { value: 0, max: 0 };
	if (game.settings.get("pf2e", "staminaVariant") && game.settings.get("healthEstimate", "PF2E.staminaToHp") && token.actor.system.attributes.sp) {
		sp = token.actor.system.attributes.sp;
	}
	if (game.settings.get("healthEstimate", "core.addTemp") && token.actor.type === "character") {
		temp = hp.temp;
	}
	return Math.min((hp.value + sp.value + temp) / (hp.max + sp.max), 1);
};
const settings = () => {
	return {
		"core.addTemp": {
			type: Boolean,
			default: false,
		},
		"core.breakOnZeroMaxHP": {
			type: Boolean,
			default: true,
		},
		"starfinder.useThreshold": {
			config: false,
			type: Boolean,
			default: false,
		},
		"starfinder.thresholdNames": {
			config: false,
			type: String,
			default: t("starfinder.thresholdNames.default"),
		},
		"starfinder.vehicleNames": {
			type: String,
			default: t("dnd5e.vehicleNames.default"),
			hint: t("dnd5e.vehicleNames.hint"),
		},
		"PF2E.staminaToHp": {
			type: Boolean,
			default: true,
		},
	};
};

const descriptions = function (descriptions, stage, token, state = { dead: false, desc: "" }, fraction) {
	if (state.dead) {
		return state.desc;
	}
	const type = token.actor.type;
	if (type === "vehicle" || type === "hazard") {
		descriptions = game.settings.get("healthEstimate", "starfinder.vehicleNames").split(/[,;]\s*/);
		stage = Math.max(0, Math.ceil((descriptions.length - 1) * fraction));
	}
	return descriptions[stage];
};

const breakCondition = `
	|| token.actor.type === 'loot'
	|| (game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.attributes.hp.max === 0)
`;

const tokenEffects = function (token) {
	return token.document.overlayEffect === game.healthEstimate.deathMarker;
};

export { fraction, settings, descriptions, breakCondition, tokenEffects };
