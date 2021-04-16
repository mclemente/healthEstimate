import {descriptions, t} from '../utils.js'

const fraction = function (token) {
	const hp    = token.actor.data.data.attributes.hp
	let temp = 0
	if (token.actor.data.type === 'vehicle' && game.settings.get('healthEstimate', 'starfinder.useThreshold')){
		if (hp.value > hp.dt) {
			return 1
		} else if (hp.value > 0) {
			return 0.5
		} else {
			return 0
		}
	}
	if (token.actor.data.type === 'character' && game.settings.get('healthEstimate', 'core.addTemp')) {
		temp = hp.temp
	}
	return Math.min((temp + hp.value) / hp.max, 1)
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
			default: t('dnd5e.vehicleNames.default').join(', '),
			hint   : t('dnd5e.vehicleNames.hint'),
		},
	}
}

const breakCondition = `||game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.data.data.attributes.hp.max === 0`

export {fraction, settings, breakCondition, descriptions}