import {t} from '../utils.js'

const fraction     = function (token) {
	const type = token.actor.data.type
	const hp   = token.actor.data.data.attributes.hp
	switch (type) {
		case 'npc':
		case 'character': {
			const sp         = token.actor.data.data.attributes.sp
			const addStamina = game.settings.get('healthEstimate', 'starfinder.addStamina') ? 1 : 0
			const temp       = game.settings.get('healthEstimate', 'core.addTemp') && (type === 'character') ? hp.temp : 0
			return Math.min((hp.value + (sp.value * addStamina) + temp) / (hp.max + (sp.max * addStamina)), 1)
		}
		case 'vehicle': {
			if (game.settings.get('healthEstimate', 'starfinder.useThreshold')) {
				if (hp.value > hp.threshold) {
					return 1
				} else if (hp.value > 0) {
					return 0.5
				} else {
					return 0
				}
			} else {
				return hp.value / hp.max
			}
		}
		case 'starship': {
			return hp.value / hp.max
		}
	}
}
const settings     = () => {
	return {
		'core.addTemp'             : {
			type   : Boolean,
			default: false,
		},
		'core.breakOnZeroMaxHP'    : {
			type   : Boolean,
			default: true,
		},
		'starfinder.addStamina'    : {
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
		},
	}
}
const descriptions = function (descriptions, stage, token, state = {isDead: false, desc: ''}, fraction) {
	if (state.isDead) {
		return state.desc
	}
	const type = token.actor.data.type
	if (type !== 'character' && type !== 'npc') {
		if (type === 'vehicle' && game.settings.get('healthEstimate', 'starfinder.useThreshold')) {
			descriptions = game.settings.get('healthEstimate', 'starfinder.thresholdNames').split(/[,;]\s*/)
		} else {
			descriptions = game.settings.get('healthEstimate', 'starfinder.vehicleNames').split(/[,;]\s*/)
		}
		stage = Math.max(0, Math.ceil((descriptions.length - 1) * fraction))
	}
	return descriptions[stage]
}

const breakCondition = `||game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.data.data.attributes.hp.max === 0`

export {fraction, settings, descriptions, breakCondition}