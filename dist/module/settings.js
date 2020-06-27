import {t} from './utils.js'
import {systemSpecificSettings, updateBreakSettings} from './systemSpecifics.js'
import {updateSettings} from './logic.js'
import {HealthEstimateStyleSettings} from './styleSettings.js'

export const registerSettings = function () {
	/**
	 * Shorthand for addSetting.
	 * Default data: {scope: "world", config: true}
	 * @function addSetting
	 * @param {string} key
	 * @param {object} data
	 */
	function addSetting (key, data) {
		const commonData = {
			name  : t(`${key}.name`),
			hint  : t(`${key}.hint`),
			scope : 'world',
			config: true
		}
		game.settings.register('healthEstimate', key, Object.assign(commonData, data))
	}

	/**
	 * Shorthand for addSetting.
	 * Default data: {scope: "world", config: false}
	 * @param {string} key
	 * @param {object} data
	 */
	function addMenuSetting (key, data) {
		const commonData = {
			name  : t(`${key}.name`),
			hint  : t(`${key}.hint`),
			scope : 'world',
			config: false
		}
		game.settings.register('healthEstimate', key, Object.assign(commonData, data))
	}

	game.settings.registerMenu('healthEstimate', 'styleSettings', {
		name      : 'Style Settings',
		label     : 'Style Settings',
		icon      : 'fas fa-palette',
		type      : HealthEstimateStyleSettings,
		restricted: true
	})


	/* Settings for the main settings menu */
	addSetting('core.onlyGM', {
		type    : Boolean,
		default : false,
		onChange: () => {
			updateBreakSettings()
		}
	})
	addSetting('core.onlyNPCs', {
		type    : Boolean,
		default : false,
		onChange: () => {
			updateBreakSettings()
		}
	})
	addSetting('core.stateNames', {
		type    : String,
		default : t('core.stateNames.default').join(', '),
		onChange: s => {
			updateSettings()
		}
	})
	addSetting('core.deathStateName', {
		type    : String,
		default : t('core.deathStateName.default'),
		onChange: s => {
			updateSettings()
		}
	})
	addSetting('core.NPCsJustDie', {
		type    : Boolean,
		default : true,
		onChange: s => {
			updateSettings()
		}
	})
	for (let [key, data] of Object.entries(systemSpecificSettings)) {
		addSetting(key, data)
	}


	/* Settings for the custom menu */
	addMenuSetting('core.menuSettings.color', {
		type   : Boolean,
		default: true
	})
	addMenuSetting('core.menuSettings.smoothGradient', {
		type   : Boolean,
		default: true
	})
	addMenuSetting('core.menuSettings.gradient', {
		type   : Object,
		default: {
			colors   : [`#FF0000`, `#00FF00`],
			positions: [0, 1]
		}
	})
	addMenuSetting(`core.menuSettings.mode`, {
		type   : String,
		default: `bez`,
		choices: {
			'bez': 'Bezier',
			'rgb': 'RGB',
			'hsl': 'HSL',
			'lch': 'LCH'
		}
	})
	addMenuSetting('core.menuSettings.deadColor', {
		type   : String,
		default: '#990000'
	})
	addMenuSetting('core.menuSettings.outline', {
		type   : Object,
		default: {
			mode      : 'darken',
			multiplier: 3
		},
		choices: {
			'darken'  : t('core.menuSettings.outline.darken'),
			'brighten': t('core.menuSettings.outline.brighten')
		}
	})
	addMenuSetting('core.menuSettings.position', {
		type   : String,
		default: 'start',
		choices: {
			'start': t('core.menuSettings.position.top'),
			'center': t('core.menuSettings.position.middle'),
			'end'  : t('core.menuSettings.position.bottom')
		}
	})
	addMenuSetting('core.menuSettings.positionAdjustment', {
		type   : Number,
		default: -1
	})
	addMenuSetting('core.menuSettings.fontSize', {
		type    : String,
		default : 'x-large',
		onChange: s => {
			document.documentElement.style.setProperty('--healthEstimate-text-size', s)
		}
	})

	/* Storage for important variables. All following settings are set and read programmatically and do not have associated UI */
	/* Default for variables.colors are pre-calculated with chroma.bezier(['#F00','#0F0']).scale().colors(100)                 */
	/* Default for variables.outline are pre-calculated by running chroma(color).darken(3) on each color in variables.colors   */
	addMenuSetting('core.variables.colors', {
		type   : Array,
		default: ['#FF0000', '#FE1300', '#FD1E00', '#FD2700', '#FC2E00', '#FB3400', '#FA3900', '#F93E00', '#F84200', '#F74600', '#F74A00', '#F64E00', '#F55200', '#F45500', '#F35800', '#F25C00', '#F15F00', '#F06200', '#EF6500', '#EE6700', '#ED6A00', '#EC6D00', '#EB7000', '#EA7200', '#E97500', '#E87700', '#E77A00', '#E67C00', '#E57E00', '#E48100', '#E28300', '#E18500', '#E08700', '#DF8A00', '#DE8C00', '#DC8E00', '#DB9000', '#DA9200', '#D99400', '#D79600', '#D69800', '#D59A00', '#D39C00', '#D29E00', '#D1A000', '#CFA200', '#CEA400', '#CCA600', '#CBA800', '#C9AA00', '#C8AC00', '#C6AE00', '#C5B000', '#C3B200', '#C1B300', '#C0B500', '#BEB700', '#BCB900', '#BABB00', '#B9BC00', '#B7BE00', '#B5C000', '#B3C200', '#B1C400', '#AFC500', '#ADC700', '#ABC900', '#A9CA00', '#A7CC00', '#A4CE00', '#A2D000', '#A0D100', '#9DD300', '#9BD500', '#98D600', '#96D800', '#93DA00', '#90DB00', '#8EDD00', '#8BDF00', '#88E000', '#84E200', '#81E400', '#7EE500', '#7AE700', '#76E900', '#73EA00', '#6FEC00', '#6AED00', '#66EF00', '#61F100', '#5CF200', '#56F400', '#50F500', '#49F700', '#42F900', '#39FA00', '#2EFC00', '#1FFD00', '#00FF00']
	})
	addMenuSetting('core.variables.outline', {
		type   : Array,
		default: ['#5A0000', '#590000', '#590000', '#590000', '#580000', '#570000', '#570000', '#560000', '#560000', '#550000', '#550000', '#550000', '#540000', '#540000', '#530000', '#530000', '#520000', '#520000', '#510000', '#510000', '#500000', '#500000', '#4F0000', '#4F0000', '#4E0000', '#4E0000', '#4D0000', '#4D0000', '#4C0000', '#4C0000', '#4B0000', '#4A0000', '#4A0000', '#490500', '#490800', '#480B00', '#470E00', '#471000', '#461300', '#451500', '#441700', '#441900', '#431B00', '#421D00', '#411E00', '#402000', '#402200', '#3E2400', '#3E2500', '#3D2700', '#3C2900', '#3B2A00', '#3A2C00', '#382D00', '#372E00', '#362F00', '#353100', '#333200', '#323400', '#313500', '#2F3600', '#2E3800', '#2C3900', '#2A3B00', '#283B00', '#263D00', '#243E00', '#223F00', '#204000', '#1C4200', '#194300', '#164400', '#114600', '#0C4700', '#064800', '#004900', '#004B00', '#004B00', '#004D00', '#004E00', '#004F00', '#005000', '#005200', '#005300', '#005400', '#005500', '#005600', '#005800', '#005800', '#005A00', '#005B00', '#005C00', '#005D00', '#005E00', '#006000', '#006100', '#006200', '#006300', '#006400', '#006600']
	})
	addMenuSetting('core.variables.deadOutline', {
		type   : String,
		default: '#340000'
	})
}
