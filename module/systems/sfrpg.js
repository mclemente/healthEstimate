import { t } from "../utils.js";

const fraction = function (token) {
	const type = token.actor.type;
	const hp = token.actor.system.attributes.hp;
	switch (type) {
		case "npc":
		case "npc2":
		case "drone":
		case "character":
			const sp = token.actor.system.attributes.sp;
			const addStamina = game.settings.get("healthEstimate", "starfinder.addStamina") ? 1 : 0;
			const temp = game.settings.get("healthEstimate", "core.addTemp") ? hp.temp ?? 0 : 0;
			return Math.min((hp.value + sp.value * addStamina + temp) / (hp.max + sp.max * addStamina), 1);
		case "vehicle":
			if (game.settings.get("healthEstimate", "starfinder.useThreshold")) {
				if (hp.value > hp.threshold) return 1;
				else if (hp.value > 0) return 0.5;
				return 0;
			}
		case "starship":
			return hp.value / hp.max;
	}
};

const descriptions = function (descriptions, stage, token, state = { dead: false, desc: "" }, fraction) {
	const type = token.actor.type;
	if (["starship", "vehicle", "drone"].includes(type)) {
		if (type == "vehicle" && game.settings.get("healthEstimate", "starfinder.useThreshold")) {
			descriptions = game.settings.get("healthEstimate", "starfinder.thresholdNames").split(/[,;]\s*/);
		} else descriptions = game.settings.get("healthEstimate", "starfinder.vehicleNames").split(/[,;]\s*/);
		stage = Math.max(0, Math.ceil((descriptions.length - 1) * fraction));
	} else if (state.dead) return state.desc;
	return descriptions[stage];
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
		"starfinder.addStamina": {
			type: Boolean,
			default: true,
		},
		"starfinder.useThreshold": {
			hint: f("starfinder.useThreshold.hint", { setting1: t("starfinder.thresholdNames.name"), setting2: t("starfinder.vehicleNames.name") }),
			type: Boolean,
			default: false,
		},
		"starfinder.thresholdNames": {
			type: String,
			default: t("starfinder.thresholdNames.default"),
		},
		"starfinder.vehicleNames": {
			type: String,
			default: t("starfinder.vehicleNames.default"),
		},
	};
};

const breakCondition = `
	|| token.actor.type === 'hazard'
	|| game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.attributes.hp.max === 0`;

export { fraction, settings, descriptions, breakCondition };
