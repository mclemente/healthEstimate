import { addSetting, isEmpty, sGet } from "./utils.js";

export let fractionFormula;
export let systemSpecificSettings = {};
/**
 * Name of the type of a vehicle.
 * Useful for systems that don't use vehicle as the type's name (e.g. vehicule).
 * It is used in the descriptions (see utils.js).
 */
export let vehicleType = "vehicle";
export let starshipType = "starship";

/**
 * Path of the token's effects.
 * Useful for systems that change how it is handled (e.g. DSA5).
 */
export function tokenEffectsPath(token) {
	return Array.from(token.actor.effects.values()).some((x) => x.icon === game.healthEstimate.deathMarker);
}

const tempHPSetting = {
	type: Boolean,
	default: false,
};

let breakConditions = {
	default: `false`,
};

function updateBreakConditions() {
	function prep(key) {
		if (isEmpty(breakConditions[key])) {
			return "";
		}
		return breakConditions[key];
	}

	game.healthEstimate.breakOverlayRender = function (token) {
		return new Function(
			`token`,
			`return (
				${prep("default")}
				${prep("onlyGM")}
				${prep("onlyNotGM")}
				${prep("onlyNPCs")}
				${prep("onlyPCs")}
				${prep("system")}
			)`
		)(token);
	};
}

/**
 * Changes which users get to see the overlay.
 */
export function updateBreakSettings() {
	breakConditions.onlyGM = sGet("core.showDescription") == 1 ? `|| !game.user.isGM` : ``;
	breakConditions.onlyNotGM = sGet("core.showDescription") == 2 ? `|| game.user.isGM` : ``;

	breakConditions.onlyPCs = sGet("core.showDescriptionTokenType") == 1 ? `|| !token.actor.hasPlayerOwner` : ``;
	breakConditions.onlyNPCs = sGet("core.showDescriptionTokenType") == 2 ? `|| token.actor.hasPlayerOwner` : ``;
	updateBreakConditions();
}

/**
 * Gets system specifics, such as its hp attribute and other settings.
 * currentSystem.settings is a function because doing it otherwise causes l18n calls to fire before they're initialized.
 * @returns {Promise}
 */
export async function prepareSystemSpecifics() {
	return new Promise(async (resolve, reject) => {
		const files = (await FilePicker.browse(...new FilePicker()._inferCurrentDirectory("modules/healthEstimate/module/systems"))).files;
		if (!files.length) reject("FilePicker hasn't found any system files.");
		for (let file in files) {
			files[file] = files[file].match(/(?<=systems\/)(.*)(?=.js)/)[0];
		}
		const system = files.includes(game.system.id) ? game.system.id : "generic";
		import(`./systems/${system}.js`)
			.catch((e) => reject(`./systems/${system}.js not found.`))
			.then((currentSystem) => {
				fractionFormula = currentSystem.fraction;
				if (currentSystem.settings !== undefined) {
					systemSpecificSettings = Object.assign(systemSpecificSettings, currentSystem.settings());
					for (let [key, data] of Object.entries(systemSpecificSettings)) {
						addSetting(key, data);
					}
				}
				if (currentSystem.breakCondition !== undefined) breakConditions.system = currentSystem.breakCondition;
				if (currentSystem.descriptions !== undefined) game.healthEstimate.descriptionToShow = currentSystem.descriptions;
				if (currentSystem.tokenEffects !== undefined) tokenEffectsPath = currentSystem.tokenEffects;
				if (currentSystem.vehicleType !== undefined) vehicleType = currentSystem.vehicleType;
				if (currentSystem.hooks !== undefined) currentSystem.hooks();
				resolve("success");
			});
	});
}
