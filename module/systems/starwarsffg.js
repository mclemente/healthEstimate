import {descriptions, t} from '../utils.js'

const fraction = function (token) {
	let hp = token.actor.data.data.stats.wounds;
	if (token.actor.data.type === 'vehicle' && game.settings.get('healthEstimate', 'starfinder.useThreshold')){
		hp = token.actor.data.data.stats.hullTrauma;
	}
	return Math.min((hp.max - hp.value) / hp.max, 1)
}
const settings = () => {
	return {
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

export {fraction, settings, descriptions}