import { t } from "../../utils.js";

export default class EstimationProvider {
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
		this.customLogic = "";

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
		 * Configuration for the Death Marker setting.
		 * @type {Object}
		 */
		this.deathMarker = {
			/** Sets if the setting will be visible in the module's settings */
			config:
				!CONFIG.statusEffects.find((x) => x.id === "dead")
				|| game.modules.get("combat-utility-belt")?.active
				|| game.modules.get("condition-lab-triggler")?.active,
			/** Sets the setting's default value */
			default: CONFIG.statusEffects.find((x) => x.id === "dead")?.img || "icons/svg/skull.svg",
		};

		/**
		 *
		 * @type {Object}
		 */
		this.vehicleRules = {
			/** Sets if the setting will be visible in the module's settings */
			config: false,
			/** List with actor types that are considered vehicles (e.g. spacecraft, drone, etc) */
			vehicles: ["vehicle"],
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

	_breakAttribute = "token.actor.system.attributes.hp.max";

	/**
	 * Calculates the fraction of the current health divided by the maximum health.
	 * @param {TokenDocument} token
	 * @returns {Number}	Number between 0.0 and 1.0.
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
	 * Is used on the breakCondition getter.
	 * @returns {String}
	 *
	 * @see alienrpgEstimationProvider
	 */
	get isVehicle() {
		return `['${this.vehicleRules.vehicles.join("','")}'].includes(token.actor.type)`;
	}

	/**
	 * A set of conditionals written as a string that will stop the rendering of the estimate.
	 * @returns {String}
	 *
	 * @see dnd5eEstimationProvider
	 * @see pf2eEstimationProvider
	 */
	get breakCondition() {
		const breakOnZeroMaxHP = game.settings.get("healthEstimate", "core.breakOnZeroMaxHP");
		// "false" was the original value of "none" for when the setting was a Boolean
		if (this.breakOnZeroMaxHP && !["false", "none"].includes(breakOnZeroMaxHP)) {
			return `|| ${this.breakAttribute} ${this.breakMaxHPValue}`;
		}
		return "|| false";
	}

	get breakAttribute() {
		return this._breakAttribute;
	}

	// eslint-disable-next-line getter-return
	get breakMaxHPValue() {
		const breakOnZeroMaxHP = game.settings.get("healthEstimate", "core.breakOnZeroMaxHP");
		// "true" was the original value of 0 for when the setting was a Boolean
		if (breakOnZeroMaxHP === "zero" || breakOnZeroMaxHP === "true") return "=== 0";
		if (breakOnZeroMaxHP === "one") return "=== 1";
		if (breakOnZeroMaxHP === "zeroOrOne") return "<= 1";
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

	/**
	 * Validates if a given HP object is valid.
	 * @param {TokenDocument} token
	 * @param {{value: Number, max: Number, temp: Number?}} hp	The HP object.
	 * @param {String} hpPath	The HP Data Path.
	 */
	_checkValidHP(token, hp, hpPath) {
		if (hp === undefined || hp === null) {
			if (hpPath === "") {
				throw new Error(
					`The HP is undefined, try using the ${game.i18n.localize(
						"healthEstimate.core.custom.FractionHP.name"
					)} setting.`
				);
			} else {
				throw new Error(
					`The ${game.i18n.localize(
						"healthEstimate.core.custom.FractionHP.name"
					)} setting ("${hpPath}") is wrong.`
				);
			}
		} else if (hp.max === undefined) {
			throw new Error(
				`Token ${token.name}'s HP has no maximum value and the etimation can't be calculated without it.`
			);
		}
	}
}

