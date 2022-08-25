import { t, descriptions } from "../utils.js";

const fraction = function (token) {
	const type = token.actor.type;
	switch (type) {
		case "npc":
		case "creature":
		case "character":
			{
				const od6swounds = token.actor.system.wounds.value;
				return 1 - od6swounds / 6;
			}
			break;
		case "vehicle":
		case "starship": {
			const od6sdamagestring = token.actor.system.damage.value;
			let od6sdamage;
			switch (od6sdamagestring) {
				case "OD6S.DAMAGE_NONE":
					od6sdamage = 0;
					break;
				case "OD6S.DAMAGE_VERY_LIGHT":
					od6sdamage = 1;
					break;
				case "OD6S.DAMAGE_LIGHT":
					od6sdamage = 2;
					break;
				case "OD6S.DAMAGE_HEAVY":
					od6sdamage = 3;
					break;
				case "OD6S.DAMAGE_SEVERE":
					od6sdamage = 4;
					break;
				case "OD6S.DAMAGE_DESTROYED":
					od6sdamage = 5;
			}
			return 1 - od6sdamage / 5;
		}
	}
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
			default: t("od6s.thresholdNames.default"),
			hint: t("od6s.thresholdNames.hint"),
		},
		"starfinder.vehicleNames": {
			type: String,
			default: t("od6s.vehicleNames.default"),
			hint: t("od6s.vehicleNames.hint"),
		},
	};
};

const breakCondition = `||token.actor.type === "container"`;

export { fraction, settings, breakCondition, descriptions };

/*
==Vehicle Levels==
OD6S.DAMAGE_NONE
OD6S.DAMAGE_VERY_LIGHT
OD6S.DAMAGE_LIGHT
OD6S.DAMAGE_HEAVY
OD6S.DAMAGE_SEVERE
OD6S.DAMAGE_DESTROYED
Destroyed, Severely Damaged, Heavily Damaged, Lightly Damaged, Very Lightly Damaged, Undamaged

==Character Levels==
Dead, Mortally Wounded, Incapacitated, Severely Wounded, Wounded, Stunned, Healthy
*/
