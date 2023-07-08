import { getNestedData } from "../lib/TokenTooltipAlt.js";
import { f, isEmpty, sGet, t } from "./utils.js";

/** Providers whose systems use "-" in their names */
export const providerKeys = {
	"age-system": "ageSystem",
	"band-of-blades": "bandOfBlades",
	"blade-runner": "bladeRunner",
	"blades-in-the-dark": "bladesInTheDark",
	"custom-system-builder": "CustomSystemBuilder",
	"cyberpunk-red-core": "cyberpunkRedCore",
	"forbidden-lands": "forbiddenLands",
	"foundryvtt-reve-de-dragon": "reveDeDragon",
	"scum-and-villainy": "scumAndVillainy",
	"uesrpg-d100": "uesrpg",
	"wrath-and-glory": "wrathAndGlory",
};

class EstimationProvider {
	constructor() {
		/**
		 * Non-exhaustive list of possible character-types that should use the DeathStateName. This is way to avoid vehicles being "Dead"
		 * @type {string[]}
		 */
		this.organicTypes = ["character", "pc", "monster", "mook", "npc", "familiar", "traveller", "animal"]; // There must be a better way

		/**
		 * Code that will be run during HealthEstimate.getTokenEstimate()
		 * @type {string}
		 */
		this.customLogic = `const type = token.actor.type;`;

		/**
		 * Default value of the Death State setting.
		 * @type {Boolean}
		 * */
		this.deathState = false;

		/**
		 * Default value of the Death State Name setting.
		 * @type {String}
		 */
		this.deathStateName = t("core.deathStateName.default");

		/**
		 * Default value of the Death Marker setting.
		 * @type {Object}
		 */
		this.deathMarker = {
			config:
				!CONFIG.statusEffects.find((x) => x.id === "dead") ||
				game.modules.get("combat-utility-belt")?.active ||
				game.modules.get("condition-lab-triggler")?.active,
			default: CONFIG.statusEffects.find((x) => x.id === "dead")?.icon || "icons/svg/skull.svg",
		};

		/**
		 * Sets if the "Add Temporary Health" setting is enabled.
		 * @type {Boolean}
		 */
		this.addTemp = false;

		/**
		 * Sets if the "Hide on tokens with 0 max HP" setting is enabled.
		 * @type {Boolean}
		 */
		this.breakOnZeroMaxHP = false;

		/**
		 * Default value of the Estimations setting.
		 * @type {{Array}}
		 */
		this.estimations = [
			{
				name: "",
				ignoreColor: false,
				rule: "default",
				estimates: [
					{ value: 0, label: t("core.estimates.states.0") },
					{ value: 25, label: t("core.estimates.states.1") },
					{ value: 50, label: t("core.estimates.states.2") },
					{ value: 75, label: t("core.estimates.states.3") },
					{ value: 99, label: t("core.estimates.states.4") },
					{ value: 100, label: t("core.estimates.states.5") },
				],
			},
		];
	}

	/**
	 * Calculates the fraction of the current health divided by the maximum health.
	 * @param {TokenDocument} token
	 */
	fraction(token) {
		throw new Error("A subclass of the SystemProvider must implement the fraction method.");
	}

	/**
	 * Returns a set of system-specific settings. All settings are registered as part of the healthEstimate module.
	 *
	 * Names and Hints are unnecessary if they are set as "systemname.setting.name" and "systemname.setting.hint".
	 *
	 * Scope is unnecessary if "world"
	 *
	 * Config is unnecessary if true
	 * @returns {{string: {SettingConfig}}}
	 */
	get settings() {
		return {};
	}

	/**
	 * A set of conditionals written as a string that will stop the rendering of the estimate.
	 * @returns {String}
	 *
	 * @see dnd5eEstimationProvider
	 * @see pf2eEstimationProvider
	 */
	static get breakCondition() {
		return undefined;
	}

	/**
	 * This is for the big marker shown on defeated tokens (the skull marker by default).
	 * Only use this if your system doesn't add the marker as an effect.
	 * @returns {Boolean}
	 *
	 * @see dsa5EstimationProvider
	 * @see pf2eEstimationProvider
	 * @see swadeEstimationProvider
	 */
	static tokenEffects(token) {
		return undefined;
	}
}

export class GenericEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.addTemp = true;
	}

	fraction(token) {
		const hpPath = sGet("core.custom.FractionHP");
		let hp = getNestedData(token, hpPath) || token.actor.system.attributes?.hp || token.actor.system.hp;
		let temp = 0;
		if (sGet("core.addTemp")) temp = Number(hp?.temp) || 0;

		if (hp === undefined && hpPath === "") {
			throw new Error(
				`The HP is undefined, try using the ${game.i18n.localize(
					"healthEstimate.core.custom.FractionHP.name"
				)} setting.`
			);
		} else if (hp === undefined) {
			throw new Error(
				`The ${game.i18n.localize(
					"healthEstimate.core.custom.FractionHP.name"
				)} setting ("${hpPath}") is wrong.`
			);
		}
		const FractionMath = sGet("core.custom.FractionMath");
		switch (FractionMath) {
			case 0:
				return Math.min((Number(hp.value) + temp) / Number(hp.max), 1);
			case 1:
			default:
				return (Number(hp.max) + temp - Number(hp.value)) / (Number(hp.max) + temp);
		}
	}

	get settings() {
		return {
			"core.custom.FractionHP": {
				type: String,
				default: "",
			},
			"core.custom.FractionMath": {
				type: Number,
				default: 0,
				choices: {
					0: t("core.custom.FractionMath.choices.0"),
					1: t("core.custom.FractionMath.choices.1"),
				},
			},
		};
	}
}

export class ageSystemEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.breakOnZeroMaxHP = true;
	}

	fraction(token) {
		const hp = token.actor.system.health;
		return hp.value / hp.max;
	}

	get breakCondition() {
		return `|| (game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.health.max === 0)`;
	}
}

export class alienrpgEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.breakOnZeroMaxHP = true;
		this.estimations = [
			...this.estimations,
			{
				name: "Vehicles & Spaceships",
				rule: `type === "vehicles" || type === "spacecraft"`,
				estimates: [
					{ value: 0, label: t("core.estimates.vehicles.0") },
					{ value: 20, label: t("core.estimates.vehicles.1") },
					{ value: 40, label: t("core.estimates.vehicles.2") },
					{ value: 60, label: t("core.estimates.vehicles.3") },
					{ value: 80, label: t("core.estimates.vehicles.4") },
					{ value: 100, label: t("core.estimates.vehicles.5") },
				],
			},
		];
	}

	fraction(token) {
		if (token.actor.type == "vehicles") {
			const hull = token.actor.system.attributes.hull;
			return hull.value / hull.max;
		} else if (token.actor.type == "spacecraft") {
			const hull = token.actor.system.attributes.hull.value;
			const damage = token.actor.system.attributes.damage.value;
			return (hull - damage) / hull;
		} else {
			const hp = token.actor.system.header.health;
			return hp.value / hp.max;
		}
	}

	get settings() {
		return {
			"PF2E.hideVehicleHP": {
				type: Boolean,
				default: false,
			},
		};
	}

	get breakCondition() {
		return `
		|| ["vehicles","spacecraft"].includes(token.actor.type) && game.settings.get('healthEstimate', 'PF2E.hideVehicleHP')
		|| (game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP')
			&& ((["vehicles","spacecraft"].includes(token.actor.type)
				&& token.actor.system.attributes.hull.max === 0)
				|| token.actor.system.header.health.max === 0)`;
	}
}

export class archmageEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.addTemp = true;
		this.breakOnZeroMaxHP = true;
	}

	fraction(token) {
		const hp = token.actor.system.attributes.hp;
		let temp = 0;
		if (token.actor.type === "character" && sGet("core.addTemp")) {
			temp = hp.temp;
		}
		return Math.min((temp + hp.value) / hp.max, 1);
	}

	get breakCondition() {
		return `|| game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.attributes.hp.max === 0`;
	}
}

export class bandOfBladesEstimationProvider extends EstimationProvider {
	fraction(token) {
		const hp = token.actor.system.harm;
		let harmLevel = 0;
		for (let [key, value] of Object.entries(hp)) {
			for (let entry of Object.values(value)) {
				if (!isEmpty(entry)) {
					//Testing for empty or whitespace
					switch (key) {
						case "light":
							harmLevel += 1;
							break;
						case "medium":
							harmLevel += 3;
							break;
						case "heavy":
							harmLevel += 9;
							break;
						case "deadly":
							return 0;
					}
				}
			}
		}
		return 1 - harmLevel / 18;
	}

	get breakCondition() {
		return `
		|| token.actor.type === "role"
		|| token.actor.type === "chosen"
		|| token.actor.type === "minion"
		|| token.actor.type === "\uD83D\uDD5B clock"`;
	}
}

export class bladeRunnerEstimationProvider extends EstimationProvider {
	fraction(token) {
		const hp = token.actor.system.health;
		return hp.value / hp.max;
	}
}

export class bladesInTheDarkEstimationProvider extends EstimationProvider {
	fraction(token) {
		const hp = token.actor.system.harm;
		let harmLevel = 0;
		for (let [key, value] of Object.entries(hp)) {
			for (let entry of Object.values(value)) {
				if (!isEmpty(entry)) {
					//Testing for empty or whitespace
					switch (key) {
						case "light":
							harmLevel += 1;
							break;
						case "medium":
							harmLevel += 3;
							break;
						case "heavy":
							harmLevel += 9;
							break;
						case "deadly":
							return 0;
					}
				}
			}
		}
		return 1 - harmLevel / 18;
	}

	get breakCondition() {
		return `
		|| token.actor.type === "npc"
		|| token.actor.type === "crew"
		|| token.actor.type === "\uD83D\uDD5B clock"
		|| token.actor.type === "factions"`;
	}
}

export class CoC7EstimationProvider extends EstimationProvider {
	fraction(token) {
		const hp = token.actor.system.attribs.hp;
		if (hp.max > 0) return hp.value / hp.max;
		return 0;
	}

	get breakCondition() {
		return `|| token.actor.type === 'container'`;
	}
}

export class CustomSystemBuilderEstimationProvider extends EstimationProvider {
	fraction(token) {
		const hpPath = sGet("core.custom.FractionHP");
		const hp = getNestedData(token, hpPath) || token.actor.system.attributes?.hp || token.actor.system.hp;
		const thpPath = sGet("custom-system-builder.tempHP");
		const temp = thpPath && token.actor.type === "character" ? Number(getNestedData(token, thpPath).temp) : 0;

		if (hp === undefined && hpPath === "")
			throw new Error(
				`The HP is undefined, try using the ${game.i18n.localize(
					"healthEstimate.core.custom.FractionHP.name"
				)} setting.`
			);
		else if (hp === undefined)
			throw new Error(
				`The ${game.i18n.localize(
					"healthEstimate.core.custom.FractionHP.name"
				)} setting ("${hpPath}") is wrong.`
			);
		else if (hp.max === undefined)
			throw new Error(
				`Token ${token.name}'s HP has no maximum value. Set it up if you intend for the estimation to work.`
			);
		const FractionMath = sGet("core.custom.FractionMath");
		switch (FractionMath) {
			case 0:
				return Math.min((Number(hp.value) + temp) / Number(hp.max), 1);
			case 1:
			default:
				return (Number(hp.max) + temp - Number(hp.value)) / (Number(hp.max) + temp);
		}
	}

	get settings() {
		return {
			"core.custom.FractionHP": {
				hint: f("custom-system-builder.FractionHP.hint", {
					dataPath1: '"actor.system.attributeBar.hp"',
					dataPath2: '"actor.system.attributeBar.health"',
				}),
				type: String,
				default: "",
			},
			"custom-system-builder.tempHP": {
				hint: f("custom-system-builder.tempHP.hint", { setting: t("core.custom.FractionHP.name") }),
				type: String,
				default: "",
			},
			"core.custom.FractionMath": {
				type: Number,
				default: 0,
				choices: {
					0: t("core.custom.FractionMath.choices.0"),
					1: t("core.custom.FractionMath.choices.1"),
				},
			},
		};
	}
}

export class cyberpunkRedCoreEstimationProvider extends EstimationProvider {
	// This game has its own estimates, called Wound State, which are calculated by the system.
	// The issue is that this data is only broadcast to GMs, not other users.
	// See https://github.com/mclemente/healthEstimate/issues/119
	// and https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core/-/issues/680

	constructor() {
		super();
		this.estimations = [
			{
				name: "",
				rule: "default",
				estimates: [
					{ value: 0, label: game.i18n.localize("CPR.global.woundState.dead") },
					{ value: 1, label: game.i18n.localize("CPR.global.woundState.mortallyWounded") },
					{ value: 50, label: game.i18n.localize("CPR.global.woundState.seriouslyWounded") },
					{ value: 99, label: game.i18n.localize("CPR.global.woundState.lightlyWounded") },
					{ value: 100, label: game.i18n.localize("CPR.global.woundState.notWounded") },
				],
			},
			{
				name: `${game.i18n.localize("ACTOR.TypeBlackice")}/${game.i18n.localize("ACTOR.TypeDemon")}`,
				rule: `type === "blackIce" || type === "demon"`,
				estimates: [
					{ value: 0, label: t("cyberpunk-red-core.unorganics.0") },
					{ value: 50, label: t("cyberpunk-red-core.unorganics.2") },
					{ value: 99, label: t("cyberpunk-red-core.unorganics.3") },
					{ value: 100, label: t("cyberpunk-red-core.unorganics.4") },
				],
			},
		];
	}

	fraction(token) {
		let hp;
		if (token.actor.system.derivedStats) {
			hp = token.actor.system.derivedStats.hp;
		} else if (token.actor.system.stats) {
			hp = token.actor.system.stats.rez;
		}
		return hp.value / hp.max;
	}

	get breakCondition() {
		return `|| token.actor.type === 'container'`;
	}
}

export class cyphersystemEstimationProvider extends EstimationProvider {
	fraction(token) {
		const actor = token.actor;
		if (actor.type === "pc") {
			const pools = actor.system.pools;
			let curr = pools.might.value + pools.speed.value + pools.intellect.value;
			let max = pools.might.max + pools.speed.max + pools.intellect.max;
			if (actor.system.settings.general.additionalPool.active) {
				curr += pools.additional.value;
				max += pools.additional.max;
			}
			const result = Math.min(1, curr / max);
			let limit = 1;

			switch (actor.system.combat.damageTrack.state) {
				case "Impaired":
					limit = sGet("cyphersystem.impaired");
					break;
				case "Debilitated":
					limit = sGet("cyphersystem.debilitated");
					break;
			}
			return Math.min(result, limit);
		} else if (actor.system.pools?.health) {
			let hp = actor.system.pools.health;
			return hp.value / hp.max;
		}
	}

	get settings() {
		return {
			"cyphersystem.impaired": {
				type: Number,
				default: 0.5,
			},
			"cyphersystem.debilitated": {
				type: Number,
				default: 0.1,
			},
		};
	}

	get breakCondition() {
		return `|| ![ 'pc', 'npc', 'companion','community' ].includes(token.actor.type)`;
	}
}

export class D35EEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.customLogic = `
		const hp = token.actor.system.attributes.hp;
		let addTemp = 0;
		if (game.settings.get("healthEstimate", "core.addTemp")) {
			addTemp = hp.temp;
		}
		const totalHp = hp.value + addTemp;`;
		this.addTemp = true;
		this.breakOnZeroMaxHP = true;
		this.estimations = [
			...this.estimations,
			{
				name: game.i18n.localize("D35E.CondStaggered"),
				ignoreColor: true,
				rule: `
					game.settings.get("healthEstimate", "PF1.showExtra") &&
					(totalHp === 0 ||
						(hp.nonlethal > 0 && totalHp == hp.nonlethal) ||
						Array.from(token.actor.effects.values()).some((x) => x.label === game.i18n.localize("D35E.CondStaggered")))`,
				estimates: [{ value: 100, label: game.i18n.localize("D35E.CondStaggered") }],
			},
			{
				name: t("PF1.dyingName.name"),
				ignoreColor: true,
				rule: `game.settings.get("healthEstimate", "PF1.showExtra") && hp.nonlethal > totalHp`,
				estimates: [{ value: 100, label: t("core.estimates.states.0") }],
			},
		];
	}

	fraction(token) {
		const hp = token.actor.system.attributes.hp;
		let addTemp = 0;
		let addNonlethal = 0;
		if (sGet("core.addTemp")) {
			addTemp = hp.temp;
		}
		if (sGet("PF1.addNonlethal")) {
			addNonlethal = hp.nonlethal;
		}
		return (hp.value - addNonlethal + addTemp) / hp.max;
	}

	get settings() {
		return {
			"PF1.addNonlethal": {
				type: Boolean,
				default: true,
			},
			"PF1.showExtra": {
				name: f("PF1.showExtra.name", {
					condition1: t("PF1.disabledName.default"),
					condition2: t("PF1.dyingName.default"),
				}),
				hint: f("PF1.showExtra.hint", {
					condition1: t("PF1.disabledName.default"),
					condition2: t("PF1.dyingName.default"),
				}),
				type: Boolean,
				default: true,
			},
			"PF1.disabledName": {
				type: String,
				default: t("PF1.disabledName.default"),
				config: false,
			},
			"PF1.dyingName": {
				type: String,
				default: t("PF1.dyingName.default"),
				config: false,
			},
		};
	}

	get breakCondition() {
		return `||game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.attributes.hp.max === 0`;
	}
}

export class dnd5eEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.addTemp = true;
		this.breakOnZeroMaxHP = true;
		this.estimations = [
			...this.estimations,
			{
				name: "Vehicles",
				rule: `type === "vehicle"`,
				estimates: [
					{ value: 0, label: t("core.estimates.vehicles.0") },
					{ value: 20, label: t("core.estimates.vehicles.1") },
					{ value: 40, label: t("core.estimates.vehicles.2") },
					{ value: 60, label: t("core.estimates.vehicles.3") },
					{ value: 80, label: t("core.estimates.vehicles.4") },
					{ value: 100, label: t("core.estimates.vehicles.5") },
				],
			},
		];
	}

	fraction(token) {
		const hp = token.actor.system.attributes.hp;
		let temp = 0;
		if (token.actor.type === "character" && sGet("core.addTemp")) {
			temp = hp.temp;
		}
		return Math.min((temp + hp.value) / hp.max, 1);
	}

	get breakCondition() {
		return `
		|| token.actor.type == 'group'
		|| token.actor.system.attributes.hp.max === null
		|| (game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.attributes.hp.max === 0)`;
	}
}

export class ds4EstimationProvider extends EstimationProvider {
	fraction(token) {
		let hp = token.actor.system.combatValues.hitPoints;
		return hp.value / hp.max;
	}
}

export class dsa5EstimationProvider extends EstimationProvider {
	fraction(token) {
		let hp = token.actor.system.status.wounds;
		return hp.value / hp.max;
	}

	tokenEffects(token) {
		return token.document.overlayEffect === game.healthEstimate.deathMarker;
	}
}

export class dungeonworldEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.breakOnZeroMaxHP = true;
	}

	fraction(token) {
		const hp = token.actor.system.attributes.hp;
		return Math.min(hp.value / hp.max, 1);
	}

	get breakCondition() {
		return `|| (game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.attributes.hp.max === 0)`;
	}

	tokenEffects(token) {
		return token.document.overlayEffect === game.healthEstimate.deathMarker;
	}
}

export class forbiddenLandsEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.breakOnZeroMaxHP = true;
	}

	fraction(token) {
		switch (token.actor.type) {
			case "character":
			case "monster":
				const hp = token.actor.system.attribute.strength;
				return Math.min(hp.value / hp.max, 1);
			default:
				return;
		}
	}

	get breakCondition() {
		return `
        || token.actor.type === "party"
        || token.actor.type === "stronghold"
        || (game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.attribute.strength.max === 0)`;
	}
}

export class reveDeDragonEstimationProvider extends EstimationProvider {
	fraction(token) {
		function ratio(node) {
			return Math.clamped(node.value / node.max, 0, 1);
		}
		function estimationBlessures(token) {
			if (token.actor.system.blessures === undefined) {
				return missing;
			}
			const nodeBlessures = token.actor.system.blessures ?? {
				legeres: { list: [] },
				graves: { list: [] },
				critiques: { list: [] },
			};
			const legeres = nodeBlessures.legeres.liste.filter((it) => it.active).length;
			const graves = nodeBlessures.graves.liste.filter((it) => it.active).length;
			const critiques = nodeBlessures.critiques.liste.filter((it) => it.active).length;

			const tableBlessure = {
				legere: [0, 10, 20, 30, 40, 50],
				grave: [0, 60, 70],
				critique: [0, 90],
				inconscient: 100,
			};
			/*
			 * Estimation of seriousness of wounds: considerinng wounds that can be taken.
			 * - 5x "legere" = light
			 * - 2x "grave" = serious
			 * - 1x "critique" = critical
			 * If one type of wounds is full, next in this category automatically goes
			 * to the next (ie: 3rd serious wound becomes critical).
			 * Using an estimation of state of health based on the worst category of wounds
			 */
			return {
				value:
					critiques > 0
						? tableBlessure.critique[critiques]
						: graves > 0
						? tableBlessure.grave[graves]
						: tableBlessure.legere[legeres],
				max: tableBlessure.inconscient,
			};
		}
		const missing = { value: 0, max: 1 };

		if (token.actor.type === "entite") {
			return ratio(token.actor.system.sante.endurance);
		}
		const ratioFatigue = 1 - ratio(token.actor.system.sante?.fatigue ?? missing) / 2;
		const ratioVie = ratio(token.actor.system.sante?.vie ?? missing);
		const ratioEndurance = 0.4 + ratio(token.actor.system.sante?.endurance ?? missing) * 0.6;
		const ratioBlessure = 1 - ratio(estimationBlessures(token));

		return Math.min(ratioBlessure, ratioEndurance, ratioFatigue, ratioVie);
	}

	get breakCondition() {
		return `||token.actor.type === "vehicule"`;
	}
}

export class lancerEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.breakOnZeroMaxHP = true;
	}

	fraction(token) {
		const hp = token.actor.system.derived.hp;
		return hp.value / hp.max;
	}

	get breakCondition() {
		return `
        || game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP')
        && (token.actor.system.mech?.hp.max === 0 || token.actor.system.hp?.max === 0)`;
	}
}

export class monsterweekEstimationProvider extends EstimationProvider {
	fraction(token) {
		const hp = token.actor.system.harm;
		return hp.value / hp.max;
	}

	get breakCondition() {
		return `||token.actor.type === "location"`;
	}
}

export class numeneraEstimationProvider extends EstimationProvider {
	fraction(token) {
		if (token.actor.type === "pc") {
			const might = token.actor.system.stats.might;
			const speed = token.actor.system.stats.speed;
			const intellect = token.actor.system.stats.intellect;
			if (sGet("numenera.countPools")) {
				let fullPools = 3;
				for (let pool of [might, speed, intellect]) {
					if (pool.pool.current === 0) {
						fullPools -= 1;
					}
				}
				return fullPools / 3;
			} else {
				let [total, max] = [0, 0];
				for (let pool of [might, speed, intellect]) {
					total += pool.pool.current;
					max += pool.pool.maximum;
				}
				return total / max;
			}
		} else {
			const hp = token.actor.system.health;
			return hp.current / hp.max;
		}
	}

	get settings() {
		return {
			"numenera.countPools": {
				type: Boolean,
				default: false,
			},
		};
	}
}

export class od6sEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.addTemp = true;
		this.breakOnZeroMaxHP = true;
		this.estimations = [
			...this.estimations,
			{
				name: "Vehicles",
				rule: `type === "vehicle" || type === "starship"`,
				estimates: [
					{ value: 0, label: t("core.estimates.vehicles.0") },
					{ value: 20, label: t("core.estimates.vehicles.1") },
					{ value: 40, label: t("core.estimates.vehicles.2") },
					{ value: 60, label: t("core.estimates.vehicles.3") },
					{ value: 80, label: t("core.estimates.vehicles.4") },
					{ value: 100, label: t("core.estimates.vehicles.5") },
				],
			},
		];
	}

	fraction(token) {
		const type = token.actor.type;
		switch (type) {
			case "npc":
			case "creature":
			case "character": {
				const od6swounds = token.actor.system.wounds.value;
				return 1 - od6swounds / 6;
			}
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
	}

	get breakCondition() {
		return `||token.actor.type === "container"`;
	}
}

export class oseEstimationProvider extends EstimationProvider {
	fraction(token) {
		const hp = token.actor.system.hp;
		return Math.min(hp.value / hp.max, 1);
	}
}

export class pbtaEstimationProvider extends EstimationProvider {
	fraction(token) {
		const hp =
			token.actor.system.attrTop.hp ||
			token.actor.system.attrLeft.hp ||
			token.actor.system.attrTop.harm ||
			token.actor.system.attrLeft.harm;
		if (hp.type == "Resource") return hp.value / hp.max;
		else return (hp.max - hp.value) / hp.max;
	}
}

export class pf1EstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.addTemp = true;
		this.breakOnZeroMaxHP = true;
		this.customLogic = `
		const hp = token.actor.system.attributes.hp;
		let addTemp = 0;
		if (game.settings.get("healthEstimate", "core.addTemp")) {
			addTemp = hp.temp;
		}
		const totalHp = hp.value + addTemp;`;
		this.estimations = [
			...this.estimations,
			{
				name: game.i18n.localize("PF1.CondStaggered"),
				ignoreColor: true,
				rule: `
					game.settings.get("healthEstimate", "PF1.showExtra") &&
					(totalHp === 0 ||
						(hp.nonlethal > 0 && totalHp == hp.nonlethal) ||
						Array.from(token.actor.effects.values()).some((x) => x.label === game.i18n.localize("PF1.CondStaggered")))`,
				estimates: [{ value: 100, label: game.i18n.localize("PF1.CondStaggered") }],
			},
			{
				name: t("PF1.dyingName.name"),
				ignoreColor: true,
				rule: `game.settings.get("healthEstimate", "PF1.showExtra") && hp.nonlethal > totalHp`,
				estimates: [{ value: 100, label: t("PF1.dyingName.default") }],
			},
		];
	}

	fraction(token) {
		const hp = token.actor.system.attributes.hp;
		let addTemp = 0;
		let addNonlethal = 0;
		if (sGet("core.addTemp")) {
			addTemp = hp.temp;
		}
		if (sGet("PF1.addNonlethal")) {
			addNonlethal = hp.nonlethal;
		}
		return (hp.value - addNonlethal + addTemp) / hp.max;
	}

	get settings() {
		return {
			"PF1.addNonlethal": {
				type: Boolean,
				default: true,
			},
			"PF1.showExtra": {
				name: f("PF1.showExtra.name", {
					condition1: t("PF1.disabledName.default"),
					condition2: t("PF1.dyingName.default"),
				}),
				hint: f("PF1.showExtra.hint", {
					condition1: t("PF1.disabledName.default"),
					condition2: t("PF1.dyingName.default"),
				}),
				type: Boolean,
				default: true,
			},
			"PF1.disabledName": {
				type: String,
				default: t("PF1.disabledName.default"),
				config: false,
			},
			"PF1.dyingName": {
				type: String,
				default: t("PF1.dyingName.default"),
				config: false,
			},
		};
	}

	get breakCondition() {
		return `||game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.attributes.hp.max === 0`;
	}
}

export class pf2eEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.addTemp = true;
		this.breakOnZeroMaxHP = true;
		this.estimations = [
			...this.estimations,
			{
				name: "Vehicles & Hazards",
				rule: `type === "vehicle" || type === "hazard"`,
				estimates: [
					{ value: 0, label: t("core.estimates.vehicles.0") },
					{ value: 20, label: t("core.estimates.vehicles.1") },
					{ value: 40, label: t("core.estimates.vehicles.2") },
					{ value: 60, label: t("core.estimates.vehicles.3") },
					{ value: 80, label: t("core.estimates.vehicles.4") },
					{ value: 100, label: t("core.estimates.vehicles.5") },
				],
			},
		];
	}

	fraction(token) {
		const data = deepClone(token.actor.system.attributes);
		const hp = data.hp;
		if (token.actor.type === "familiar" && token.actor.system?.master) {
			const master = token.actor.system.master;
			hp.max = token.actor.hitPoints.max ?? 5 * game.actors.get(master.id).system.details.level.value;
		}
		let temp = sGet("core.addTemp") && hp.temp ? hp.temp : 0;
		let sp =
			game.settings.get("pf2e", "staminaVariant") && sGet("PF2E.staminaToHp") && data.sp
				? data.sp
				: { value: 0, max: 0 };
		return Math.min((hp.value + sp.value + temp) / (hp.max + sp.max), 1);
	}

	get settings() {
		return {
			"PF2E.staminaToHp": {
				type: Boolean,
				default: true,
			},
			"PF2E.hideHazardHP": {
				type: Boolean,
				default: true,
			},
			"PF2E.hideVehicleHP": {
				type: Boolean,
				default: false,
			},
			"PF2E.workbenchMystifier": {
				hint: f("PF2E.workbenchMystifier.hint", { setting: "core.unknownEntity.name" }),
				config: game.modules.get("xdy-pf2e-workbench")?.active ?? false,
				type: Boolean,
				default: false,
			},
		};
	}

	get breakCondition() {
		return `
        || token.actor.type === 'vehicle' && game.settings.get('healthEstimate', 'PF2E.hideVehicleHP')
        || token.actor.type === 'hazard' && game.settings.get('healthEstimate', 'PF2E.hideHazardHP')
        || token.actor.type === 'loot'
        || (game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.attributes.hp.max === 0)`;
	}

	tokenEffects(token) {
		return token.document.overlayEffect === game.healthEstimate.deathMarker;
	}
}

export class ryuutamaEstimationProvider extends EstimationProvider {
	fraction(token) {
		const hp = token.actor.system.hp;
		return hp.value / hp.max;
	}
}

export class scumAndVillainyEstimationProvider extends EstimationProvider {
	fraction(token) {
		const hp = token.actor.system.harm;
		let harmLevel = 0;
		for (let [key, value] of Object.entries(hp)) {
			for (let entry of Object.values(value)) {
				if (!isEmpty(entry)) {
					//Testing for empty or whitespace
					switch (key) {
						case "light":
							harmLevel += 1;
							break;
						case "medium":
							harmLevel += 3;
							break;
						case "heavy":
							harmLevel += 9;
							break;
						case "deadly":
							return 0;
					}
				}
			}
		}
		return 1 - harmLevel / 18;
	}

	get breakCondition() {
		return `||token.actor.type === "ship"||token.actor.type === "\uD83D\uDD5B clock"||token.actor.type === "universe"`;
	}
}

export class sfrpgEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.addTemp = true;
		this.breakOnZeroMaxHP = true;
		this.estimations = [
			...this.estimations,
			{
				name: "Vehicle Threshold",
				rule: `type === "vehicle" && game.settings.get("healthEstimate", "starfinder.useThreshold")`,
				estimates: [
					{ value: 0, label: t("core.estimates.thresholds.0") },
					{ value: 50, label: t("core.estimates.thresholds.1") },
					{ value: 100, label: t("core.estimates.thresholds.2") },
				],
			},
			{
				name: "Vehicles, Starships & Drones",
				rule: `["starship", "vehicle", "drone"].includes(type)`,
				estimates: [
					{ value: 0, label: t("core.estimates.vehicles.0") },
					{ value: 20, label: t("core.estimates.vehicles.1") },
					{ value: 40, label: t("core.estimates.vehicles.2") },
					{ value: 60, label: t("core.estimates.vehicles.3") },
					{ value: 80, label: t("core.estimates.vehicles.4") },
					{ value: 100, label: t("core.estimates.vehicles.5") },
				],
			},
		];
	}

	fraction(token) {
		const type = token.actor.type;
		const hp = token.actor.system.attributes.hp;
		switch (type) {
			case "npc":
			case "npc2":
			case "drone":
			case "character":
				const sp = token.actor.system.attributes.sp;
				const addStamina = sGet("starfinder.addStamina") ? 1 : 0;
				const temp = sGet("core.addTemp") ? hp.temp ?? 0 : 0;
				return Math.min((hp.value + sp.value * addStamina + temp) / (hp.max + sp.max * addStamina), 1);
			case "vehicle":
				if (sGet("starfinder.useThreshold")) {
					if (hp.value > hp.threshold) return 1;
					else if (hp.value > 0) return 0.5;
					return 0;
				}
			case "starship":
				return hp.value / hp.max;
		}
	}

	get settings() {
		return {
			"starfinder.addStamina": {
				type: Boolean,
				default: true,
			},
			"starfinder.useThreshold": {
				type: Boolean,
				default: false,
			},
		};
	}

	get breakCondition() {
		return `
        || token.actor.type === 'hazard'
        || game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.attributes.hp.max === 0`;
	}
}

export class shadowrun5eEstimationProvider extends EstimationProvider {
	fraction(token) {
		const stun = token.actor.system.track.stun;
		const physical = token.actor.system.track.physical;
		return Math.min((stun.max - stun.value) / stun.max, (physical.max - physical.value) / physical.max);
	}
}

export class splittermondEstimationProvider extends EstimationProvider {
	fraction(token) {
		const hp = token.actor.system.health;
		return hp.total.value / hp.max;
	}
}

export class starwarsffgEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.estimations = [
			...this.estimations,
			{
				name: "Vehicles",
				rule: `type === "vehicle"`,
				estimates: [
					{ value: 0, label: t("core.estimates.vehicles.0") },
					{ value: 20, label: t("core.estimates.vehicles.1") },
					{ value: 40, label: t("core.estimates.vehicles.2") },
					{ value: 60, label: t("core.estimates.vehicles.3") },
					{ value: 80, label: t("core.estimates.vehicles.4") },
					{ value: 100, label: t("core.estimates.vehicles.5") },
				],
			},
		];
	}

	fraction(token) {
		let hp = token.actor.system.stats.wounds;
		if (token.actor.type === "vehicle") {
			hp = token.actor.system.stats.hullTrauma;
		}
		return Math.min((hp.max - hp.value) / hp.max, 1);
	}
}

export class swadeEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.deathStateName = game.i18n.localize("SWADE.Incap");
		this.deathMarker.config = game.modules.get("condition-lab-triggler")?.active;
		this.estimations = [
			{
				name: "",
				rule: "default",
				estimates: [
					{ value: 0, label: game.i18n.localize("SWADE.Incap") },
					{ value: 25, label: t("core.estimates.states.1") },
					{ value: 50, label: t("core.estimates.states.2") },
					{ value: 99, label: t("core.estimates.states.3") },
					{ value: 100, label: t("core.estimates.states.5") },
				],
			},
			{
				name: "Vehicles",
				rule: `type === "vehicle"`,
				estimates: [
					{ value: 0, label: t("core.estimates.vehicles.0") },
					{ value: 20, label: t("core.estimates.vehicles.1") },
					{ value: 40, label: t("core.estimates.vehicles.2") },
					{ value: 60, label: t("core.estimates.vehicles.3") },
					{ value: 80, label: t("core.estimates.vehicles.4") },
					{ value: 100, label: t("core.estimates.vehicles.5") },
				],
			},
		];
	}

	fraction(token) {
		const hp = token.actor.system.wounds;
		let maxHP = Math.max(hp.max, 1);
		if (token.actor.system.wildcard) {
			const defaultWildCardMaxWounds = sGet("swade.defaultWildCardMaxWounds");
			maxHP = 1 + Math.max(hp.max || defaultWildCardMaxWounds, 1);
		}
		return (maxHP - hp.value) / maxHP;
	}

	get settings() {
		return {
			"swade.defaultWildCardMaxWounds": {
				type: Number,
				default: 3,
				range: {
					min: 1,
					max: 10,
				},
			},
		};
	}

	tokenEffects(token) {
		const incapIcon = CONFIG.statusEffects.find((effect) => effect.id === "incapacitated").icon;
		return !!token.actor.effects.find((e) => e.icon === incapIcon);
	}
}

export class swnrEstimationProvider extends EstimationProvider {
	fraction(token) {
		const hp = token.actor.system.health;
		return Math.min(hp.value / hp.max, 1);
	}
}

export class symbaroumEstimationProvider extends EstimationProvider {
	fraction(token) {
		const hp = token.actor.system.health.toughness;
		return hp.value / hp.max;
	}
}

export class t2k4eEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.addTemp = true;
		this.breakOnZeroMaxHP = true;
		this.estimations = [
			...this.estimations,
			{
				name: "Vehicles",
				rule: `type === "vehicle"`,
				estimates: [
					{ value: 0, label: t("core.estimates.vehicles.0") },
					{ value: 20, label: t("core.estimates.vehicles.1") },
					{ value: 40, label: t("core.estimates.vehicles.2") },
					{ value: 60, label: t("core.estimates.vehicles.3") },
					{ value: 80, label: t("core.estimates.vehicles.4") },
					{ value: 100, label: t("core.estimates.vehicles.5") },
				],
			},
		];
	}

	fraction(token) {
		const type = token.actor.type;
		if (type == "vehicle") {
			var hp = token.actor.system.reliability;
		} else hp = token.actor.system.health.toughness;
		let temp = 0;
		if (type != "vehicle" && sGet("core.addTemp")) {
			temp = hp.temp;
		}
		return Math.min((temp + hp.value) / hp.max, 1);
	}

	get breakCondition() {
		return `
		||token.actor.type == "unit"
		|| token.actor.type == "party"
		||game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.health.toughness.max === 0`;
	}
}

export class tor2eEstimationProvider extends EstimationProvider {
	fraction(token) {
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
	}
}

export class tormenta20EstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.addTemp = true;
		this.breakOnZeroMaxHP = true;
	}

	fraction(token) {
		const hp = token.actor.system.attributes.pv;
		let temp = 0;
		if (token.actor.type === "character" && sGet("core.addTemp")) {
			temp = hp.temp;
		}
		return Math.min((temp + hp.value) / hp.max, 1);
	}

	get breakCondition() {
		return `||game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.attributes.pv.max === 0`;
	}
}

export class trpgEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.addTemp = true;
		this.breakOnZeroMaxHP = true;
	}

	fraction(token) {
		const hp = token.actor.system.attributes.hp;
		let temp = 0;
		if (token.actor.type === "character" && sGet("core.addTemp")) {
			temp = hp.temp;
		}
		return Math.min((temp + hp.value) / hp.max, 1);
	}

	get breakCondition() {
		return `||game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.attributes.hp.max === 0`;
	}
}

export class twodsixEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.estimations = [
			...this.estimations,
			{
				name: "Vehicles",
				rule: `type === "vehicle" || type === "ship"`,
				estimates: [
					{ value: 0, label: t("core.estimates.vehicles.0") },
					{ value: 20, label: t("core.estimates.vehicles.1") },
					{ value: 40, label: t("core.estimates.vehicles.2") },
					{ value: 60, label: t("core.estimates.vehicles.3") },
					{ value: 80, label: t("core.estimates.vehicles.4") },
					{ value: 100, label: t("core.estimates.vehicles.5") },
				],
			},
		];
	}

	fraction(token) {
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
	}
}

export class uesrpgEstimationProvider extends EstimationProvider {
	fraction(token) {
		const hp = token.actor.system.hp;
		return hp.value / hp.max;
	}
}

export class yzecoriolisEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.breakOnZeroMaxHP = true;
		this.estimations = [
			...this.estimations,
			{
				name: "Ships",
				rule: `type === "ship"`,
				estimates: [
					{ value: 0, label: t("core.estimates.vehicles.0") },
					{ value: 20, label: t("core.estimates.vehicles.1") },
					{ value: 40, label: t("core.estimates.vehicles.2") },
					{ value: 60, label: t("core.estimates.vehicles.3") },
					{ value: 80, label: t("core.estimates.vehicles.4") },
					{ value: 100, label: t("core.estimates.vehicles.5") },
				],
			},
		];
	}

	fraction(token) {
		const type = token.actor.type;
		if (type == "ship") var hp = token.actor.system.hullPoints;
		else hp = token.actor.system.hitPoints;
		return hp.value / hp.max;
	}
}

export class wfrp4eEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.breakOnZeroMaxHP = true;
		this.estimations = [
			...this.estimations,
			{
				name: "Vehicles",
				rule: `type === "vehicle"`,
				estimates: [
					{ value: 0, label: t("core.estimates.vehicles.0") },
					{ value: 20, label: t("core.estimates.vehicles.1") },
					{ value: 40, label: t("core.estimates.vehicles.2") },
					{ value: 60, label: t("core.estimates.vehicles.3") },
					{ value: 80, label: t("core.estimates.vehicles.4") },
					{ value: 100, label: t("core.estimates.vehicles.5") },
				],
			},
		];
	}

	fraction(token) {
		const hp = token.actor.system.status.wounds;
		return hp.value / hp.max;
	}

	get settings() {
		return {
			"PF2E.hideVehicleHP": {
				type: Boolean,
				default: false,
			},
		};
	}

	get breakCondition() {
		return `
		|| token.actor.type === "vehicle" && game.settings.get('healthEstimate', 'PF2E.hideVehicleHP')
		|| (game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.status.wounds === 0)`;
	}
}

export class worldbuildingEstimationProvider extends EstimationProvider {
	fraction(token) {
		/* Can't think of a different way to do it that doesn't involve FS manipulation, which is its own can of worms */
		const setting = sGet("worldbuilding.simpleRule");
		return Function("token", setting)(token);
	}
	get settings() {
		return {
			"worldbuilding.simpleRule": {
				type: String,
				default: "const hp = token.actor.system.health; return hp.value / hp.max",
			},
		};
	}
}

export class wrathAndGloryEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.addTemp = true;
		this.breakOnZeroMaxHP = true;
		this.organicTypes = ["agent", "threat"];
	}

	fraction(token) {
		const hp = token.actor.system.combat.wounds;
		let temp = 0;
		if (sGet("core.addTemp")) temp = Number(hp.bonus);
		return (Number(hp.max) + temp - Number(hp.value)) / (Number(hp.max) + temp);
	}

	get breakCondition() {
		return `|| (game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.combat.wounds.max === 0)`;
	}
}
