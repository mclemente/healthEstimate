import {t}                                           from "./utils.js"
import {systemSpecificSettings, updateBreakSettings} from "./systemSpecifics.js"
import {updateSettings}                              from "./logic.js"
import {HealthEstimateColorSettings}                 from "./colorSettings.js"

export const registerSettings = function () {
	function addSetting(key, data, scope = "world", config = true) {
		const commonData = {
			name:   t(`${key}.name`),
			hint:   t(`${key}.hint`),
			scope:  scope,
			config: config
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
		type:    String,
		default: t("core.stateNames.default").join(", "),
		onChange: s => { updateSettings() }
	})
	addSetting("core.deathStateName", {
		type:    String,
		default: t("core.deathStateName.default"),
	})
	for (let [key, data] of Object.entries(systemSpecificSettings)) {
		addSetting(key, data)
	}
	addSetting("core.fontSize", {
		type:    String,
		default: "x-large",
		onChange: s => { document.documentElement.style.setProperty('--healthEstimate-text-size', s) }
	}, "client")
	addSetting("core.color", {
		type:     Boolean,
		default:  true,
		onChange: s => { updateSettings() }
	})
	addSetting("core.smoothGradient", {
		type:    Boolean,
		default: true,
		onChange: s => { updateSettings() }
	})
}
