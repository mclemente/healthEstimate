import {t} from '../utils.js'

const fraction     = function (token) {
	const hp    = token.actor.data.data.attributes.hp
	let addTemp = 0
	let addNonlethal = 0
	if (game.settings.get('healthEstimate', 'core.addTemp')) {
		addTemp = hp.temp
	}
	if (game.settings.get('healthEstimate', 'PF1.addNonlethal')) {
		addNonlethal = hp.nonlethal
	}
	return (hp.value - addNonlethal + addTemp) / hp.max
}
const settings     = () => {
	return {
		'core.addTemp'    : {
			type   : Boolean,
			default: false,
		},
		'core.breakOnZeroMaxHP': {
			type   : Boolean,
			default: true,
		},
		'PF1.addNonlethal' : {
			type   : Boolean,
			default: true,
		},
		'PF1.showExtra'   : {
			type   : Boolean,
			default: true,
		},
		'PF1.disabledName': {
			type   : String,
			default: t('PF1.disabledName.default')
		},
		'PF1.dyingName'   : {
			type   : String,
			default: t('PF1.dyingName.default')
		}
	}
}
const descriptions = function (descriptions, stage, token, state = {isDead: false, desc: ''}) {
	const hp = token.actor.data.data.attributes.hp

	if (hp.nonlethal >= hp.value && hp.value > 0){
		return game.settings.get("healthEstimate", "PF1.disabledName")
	}
	if (state.isDead) {
		return state.desc
	}
	if (game.settings.get("healthEstimate", "PF1.showExtra") && hp.value < 1) {
		if (hp.value === 0) {
			return game.settings.get("healthEstimate", "PF1.disabledName")
		} else {
			return game.settings.get('healthEstimate', 'PF1.dyingName')
		}
	} else {
		return descriptions[stage]
	}
}
const breakCondition = `||game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.data.data.attributes.hp.max === 0`

export {fraction, settings, descriptions, breakCondition}
