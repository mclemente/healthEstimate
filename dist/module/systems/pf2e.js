import {t} from '../utils.js'

const fraction = function (token) {
	const hp = token.actor.data.data.attributes.hp
	let temp = 0
	if (token.actor.data.type === 'vehicle' && game.settings.get('healthEstimate', 'starfinder.useThreshold')) {
		if (hp.value > hp.brokenThreshold) {
			return 1
		} else if (hp.value > 0) {
			return 0.5
		} else {
			return 0
		}
	}
	if (game.settings.get('healthEstimate', 'core.addTemp') && token.actor.data.type === 'character') {
		temp = hp.temp
	}
	return Math.min((hp.value + temp) / hp.max, 1)
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

const descriptions = function (descriptions, stage, token, state = {isDead: false, desc: ''}, fraction) {
	if (state.isDead) {
		return state.desc
	}
	const type = token.actor.data.type
	if (type === 'vehicle' || type === 'hazard') {
		if (type === 'vehicle' && game.settings.get('healthEstimate', 'starfinder.useThreshold')) {
			descriptions = game.settings.get('healthEstimate', 'starfinder.thresholdNames').split(/[,;]\s*/)
		} else {
			descriptions = game.settings.get('healthEstimate', 'starfinder.vehicleNames').split(/[,;]\s*/)
		}
		stage = Math.max(0, Math.ceil((descriptions.length - 1) * fraction))
	}
	return descriptions[stage]
}

const breakCondition = `
	|| token.actor.data.type === 'loot'
	|| (game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.data.data.attributes.hp.max === 0)
`

export {fraction, settings, descriptions, breakCondition}