import {t} from '../utils.js'

const fraction     = function (token) {
	const hp    = token.actor.data.data.attributes.hp
	let addTemp = 0
	if (game.settings.get('healthEstimate', 'core.addTemp')) {
		addTemp = 1
	}
	return Math.min((hp.value - hp.nonlethal + (hp.temp * addTemp)) / hp.max, 1)
}
const settings     = () => {
	return {
		'core.addTemp'    : {
			type   : Boolean,
			default: false,
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
const descriptions = function (descriptions, stage, token) {
	const hp = token.actor.data.data.attributes.hp
	if (hp.value < 1) {
		if (hp.value === 0) {
			return game.settings.get("healthEstimate", "PF1.disabledName")
		} else {
			return game.settings.get('healthEstimate', 'PF1.dyingName')
		}
	} else {
		return descriptions[stage]
	}
}

export {fraction, settings, descriptions}