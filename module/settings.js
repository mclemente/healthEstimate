import {t} from './utils.js'
import {updateBreakSettings} from './systemSpecifics.js'
import {updateSettings} from './logic.js'
import {HealthEstimateStyleSettings} from './styleSettings.js'
import {HealthEstimateDeathSettings} from './deathSettings.js'

/**
 * Shorthand for addSetting.
 * Default data: {scope: "world", config: true}
 * @function addSetting
 * @param {string} key
 * @param {object} data
 */
export function addSetting (key, data) {
	const commonData = {
		name: t(`${key}.name`),
		hint: t(`${key}.hint`),
		scope: 'world',
		config: true
	}
	game.settings.register('healthEstimate', key, Object.assign(commonData, data))
}

export const registerSettings = function () {
	/**
	 * Shorthand for addSetting.
	 * Default data: {scope: "world", config: false}
	 * @param {string} key
	 * @param {object} data
	 */
	function addMenuSetting (key, data) {
		const commonData = {
			name: t(`${key}.name`),
			hint: t(`${key}.hint`),
			scope: 'world',
			config: false
		}
		game.settings.register('healthEstimate', key, Object.assign(commonData, data))
	}

	game.settings.registerMenu('healthEstimate', 'styleSettings', {
		name: 'Style Settings',
		label: 'Style Settings',
		icon: 'fas fa-palette',
		type: HealthEstimateStyleSettings,
		restricted: true
	})
	game.settings.registerMenu('healthEstimate', 'deathSettings', {
		name: 'Death Settings',
		label: 'Death Settings',
		icon: 'fas fa-skull',
		type: HealthEstimateDeathSettings,
		restricted: true
	})

	/* Settings for the main settings menu */
	addSetting('core.showDescription', {
		type: Number,
		default: 0,
		choices: {
			0 : t('core.showDescription.choices.all'),
			1 : t('core.showDescription.choices.GM'),
			2 : t('core.showDescription.choices.Players'),
			3 : t('core.showDescription.choices.NPC'),
			4 : t('core.showDescription.choices.PC')
		},
		onChange: () => {
			updateBreakSettings()
		}
	})
	addSetting('core.stateNames', {
		type: String,
		default: t('core.stateNames.default').join(', '),
		onChange: s => {
			updateSettings()
		}
	})
	addSetting('core.perfectionism', {
		type: Boolean,
		default: false,
		onChange: s => {
			updateSettings()
		}
	})
	addSetting('core.outputChat', {
		type: Boolean,
		default: false,
		onChange: s => {
			updateSettings()
		}
	})

	/* Settings for the death menu */
	addMenuSetting('core.deathState', {
		'type'   : Boolean,
		'default': false,
		onChange : s => {
			updateSettings()
		}
	})
	addMenuSetting('core.deathStateName', {
		type: String,
		default: t('core.deathStateName.default'),
		onChange: s => {
			updateSettings()
		}
	})
	addMenuSetting('core.NPCsJustDie', {
		type: Boolean,
		default: true,
		onChange: s => {
			updateSettings()
		}
	})
	addMenuSetting('core.deathMarker', {
		type    : String,
		default : 'icons/svg/skull.svg',
		onChange: s => {
			updateSettings()
		}
	})
	

	/* Settings for the custom menu */
	addMenuSetting('core.menuSettings.useColor', {
		type: Boolean,
		default: true
	})
	addMenuSetting('core.menuSettings.smoothGradient', {
		type: Boolean,
		default: true
	})
	addMenuSetting('core.menuSettings.gradient', {
		type: Object,
		default: {
			colors: [`#FF0000`, `#00FF00`],
			positions: [0, 1]
		}
	})
	addMenuSetting(`core.menuSettings.mode`, {
		type: String,
		default: `hsl`,
		choices: {
			'bez': 'Bezier',
			'rgb': 'RGB',
			'hsl': 'HSL',
			'lch': 'LCH'
		}
	})
	addMenuSetting('core.menuSettings.deadColor', {
		type: String,
		default: '#990000'
	})
	addMenuSetting('core.menuSettings.outline', {
		type: Object,
		default: {
			mode: 'darken',
			multiplier: 3
		},
		choices: {
			'darken': t('core.menuSettings.outline.darken'),
			'brighten': t('core.menuSettings.outline.brighten')
		}
	})
	addMenuSetting('core.menuSettings.position', {
		type: String,
		default: 'start',
		choices: {
			'start': t('core.menuSettings.position.top'),
			'center': t('core.menuSettings.position.middle'),
			'end': t('core.menuSettings.position.bottom')
		}
	})
	addMenuSetting('core.menuSettings.positionAdjustment', {
		type: Number,
		default: -1
	})
	addMenuSetting('core.menuSettings.fontSize', {
		type: String,
		default: 'x-large',
		onChange: s => {
			document.documentElement.style.setProperty('--healthEstimate-text-size', s)
		}
	})

	/* Storage for important variables. All following settings are set and read programmatically and do not have associated UI */
	/* Default for variables.colors are pre-calculated with chroma.scale(['#F00','#0F0']).mode('hsl').colors(100)                 */
	/* Default for variables.outline are pre-calculated by running chroma(color).darken(3) on each color in variables.colors   */
	addMenuSetting('core.variables.colors', {
		type: Array,
		default: ["#ff0000", "#ff0500", "#ff0a00", "#ff0f00", "#ff1500", "#ff1a00", "#ff1f00", "#ff2400", "#ff2900", "#ff2e00", "#ff3400", "#ff3900", "#ff3e00", "#ff4300", "#ff4800", "#ff4d00", "#ff5200", "#ff5800", "#ff5d00", "#ff6200", "#ff6700", "#ff6c00", "#ff7100", "#ff7600", "#ff7c00", "#ff8100", "#ff8600", "#ff8b00", "#ff9000", "#ff9500", "#ff9b00", "#ffa000", "#ffa500", "#ffaa00", "#ffaf00", "#ffb400", "#ffb900", "#ffbf00", "#ffc400", "#ffc900", "#ffce00", "#ffd300", "#ffd800", "#ffde00", "#ffe300", "#ffe800", "#ffed00", "#fff200", "#fff700", "#fffc00", "#fcff00", "#f7ff00", "#f2ff00", "#edff00", "#e8ff00", "#e3ff00", "#deff00", "#d8ff00", "#d3ff00", "#ceff00", "#c9ff00", "#c4ff00", "#bfff00", "#b9ff00", "#b4ff00", "#afff00", "#aaff00", "#a5ff00", "#a0ff00", "#9bff00", "#95ff00", "#90ff00", "#8bff00", "#86ff00", "#81ff00", "#7cff00", "#76ff00", "#71ff00", "#6cff00", "#67ff00", "#62ff00", "#5dff00", "#58ff00", "#52ff00", "#4dff00", "#48ff00", "#43ff00", "#3eff00", "#39ff00", "#34ff00", "#2eff00", "#29ff00", "#24ff00", "#1fff00", "#1aff00", "#15ff00", "#0fff00", "#0aff00", "#05ff00", "#00ff00"]
	})
	addMenuSetting('core.variables.outline', {
		type: Array,
		default: ["#5a0000", "#5a0000", "#5a0000", "#5a0000", "#5a0000", "#5a0000", "#5a0000", "#5a0000", "#5a0000", "#5a0000", "#5a0000", "#5a0000", "#5a0000", "#5a0000", "#5a0000", "#5a0000", "#5b0000", "#5b0000", "#5b0000", "#5b0000", "#5c0000", "#5c0000", "#5c0000", "#5d0000", "#5d0000", "#5e0000", "#5e0000", "#5e0000", "#5f0100", "#5f0a00", "#5f1400", "#601a00", "#601f00", "#602500", "#602900", "#612e00", "#613300", "#613800", "#613c00", "#614000", "#614500", "#614900", "#614d00", "#615200", "#615600", "#615a00", "#615e00", "#616300", "#606700", "#606b00", "#5d6d00", "#596d00", "#556d00", "#506d00", "#4c6d00", "#476d00", "#426c00", "#3c6c00", "#376c00", "#326c00", "#2c6c00", "#256b00", "#1e6b00", "#136b00", "#056b00", "#006a00", "#006a00", "#006a00", "#006a00", "#006a00", "#006900", "#006900", "#006900", "#006900", "#006800", "#006800", "#006800", "#006800", "#006800", "#006700", "#006700", "#006700", "#006700", "#006700", "#006700", "#006600", "#006600", "#006600", "#006600", "#006600", "#006600", "#006600", "#006600", "#006600", "#006600", "#006600", "#006600", "#006600", "#006600", "#006600"]
	})
	addMenuSetting('core.variables.deadColor', {
		type: String,
		default: '#990000'
	})
	addMenuSetting('core.variables.deadOutline', {
		type: String,
		default: '#340000'
	})
}
