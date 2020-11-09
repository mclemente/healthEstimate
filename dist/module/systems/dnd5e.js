// import {addTemp, breakOnZeroMaxHP} from './commonSettings.js'
import {descriptions} from './starfinder.js'
import {t} from '../utils.js'

const fraction = function (token) {
	const hp    = token.actor.data.data.attributes.hp
	let addTemp = 0
	if (token.actor.data.type === 'character' && game.settings.get('healthEstimate', 'core.addTemp')) {
		addTemp = 1
	}
	return Math.min((hp.temp * addTemp + hp.value) / hp.max, 1)
}
const settings = () => {
	return {
		'core.addTemp'             : {
			type   : Boolean,
			default: false,
		},
		'core.breakOnZeroMaxHP'    : {
			type   : Boolean,
			default: true,
		},
		'starfinder.useThreshold'  : {
			type   : Boolean,
			default: false,
		},
		'starfinder.thresholdNames': {
			type   : String,
			default: t('starfinder.thresholdNames.default').join(', '),
		},
		'starfinder.vehicleNames'  : {
			type   : String,
			default: t('starfinder.vehicleNames.default').join(', '),
			hint   : t('dnd5e.vehicleNames.hint'),
		},
	}
}

const breakCondition = `||game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.data.data.attributes.hp.max === 0`

export {fraction, settings, breakCondition, descriptions}