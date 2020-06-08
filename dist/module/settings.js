import {t}                                           from "./utils.js"
import {systemSpecificSettings, updateBreakSettings} from "./systemSpecifics.js"
import {updateSettings}                              from "./logic.js"
import {HealthEstimateColorSettings}                 from "./colorSettings.js"

export const registerSettings = function () {
	/**
	 * Shorthand for addSetting. Default data: {scope: "world", "config": true}
	 * @function addSetting
	 * @param {string} key
	 * @param {object} data
	 */
	function addSetting(key, data) {
		const commonData = {
			name:   t(`${key}.name`),
			hint:   t(`${key}.hint`),
			scope:  "world",
			config: true
		}
		game.settings.register("healthEstimate", key, Object.assign(commonData, data))
	}
	
	/**
	 * Shorthand for addSetting. Default data: {scope: "world", "config": false}
	 * @param {string} key
	 * @param {object} data
	 */
	function addMenuSetting(key, data) {
		const commonData = {
			scope:  "world",
			config: false
		}
		game.settings.register("healthEstimate", key, Object.assign(commonData, data))
	}
	
	game.settings.registerMenu("healthEstimate", "colorSettings", {
		name:       "Health Estimate Color Settings",
		label:      "Color Settings",
		icon:       "fas fa-palette",
		type:       HealthEstimateColorSettings,
		restricted: true
	})
	
	addSetting("core.onlyGM", {
		type:     Boolean,
		default:  false,
		onChange: () => {
			updateBreakSettings()
		}
	})
	addSetting("core.onlyNPCs", {
		type:     Boolean,
		default:  false,
		onChange: () => {
			updateBreakSettings()
		}
	})
	addSetting("core.stateNames", {
		type:     String,
		default:  t("core.stateNames.default").join(", "),
		onChange: s => {
			updateSettings()
		}
	})
	addSetting("core.deathStateName", {
		type:    String,
		default: t("core.deathStateName.default"),
	})
	for (let [key, data] of Object.entries(systemSpecificSettings)) {
		addSetting(key, data)
	}
	addSetting("core.fontSize", {
		type:     String,
		default:  "x-large",
		scope:    "client",
		onChange: s => {
			document.documentElement.style.setProperty('--healthEstimate-text-size', s)
		}
	})
	addSetting("core.color", {
		type:     Boolean,
		default:  true,
		onChange: s => {
			updateSettings()
		}
	})
	addSetting("core.smoothGradient", {
		type:     Boolean,
		default:  true,
		onChange: s => {
			updateSettings()
		}
	})
	addMenuSetting("core.colorSettings.gradient", {
		type:    Object,
		default: {
			colors:    [`#F00`, `#0F0`],
			positions: [0, 1]
		}
	})
	addMenuSetting(`core.colorSettings.bezier`, {
		type: Boolean,
		default: true
	})
	addMenuSetting(`core.colorSettings.lightCorrection`, {
		type: Boolean,
		default: false
	})
	addMenuSetting(`core.colorSettings.mode`, {
		type: String,
		default: `rgb`
	})
}
