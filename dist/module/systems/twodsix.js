import {t} from '../utils.js'

const fraction = function (token) {
	switch (token.actor.data.type) {
		case 'traveller': {
			const hp = token.actor.data.data.hits
			return hp.value / hp.max
		}
		case 'ship': {
			const hp = token.actor.data.data.ship.shipStats
			return hp.hullCurrent / hp.hull
		}
	}
}

const settings = () => {
	return {
		'starfinder.vehicleNames'  : {
			type   : String,
			default: t('starfinder.vehicleNames.default').join(', '),
		},
	}
}

const descriptions = function (descriptions, stage, token, state = {isDead: false, desc: ''}, fraction) {
	if (token.actor.data.type === 'ship') {
		descriptions = game.settings.get('healthEstimate', 'starfinder.vehicleNames').split(/[,;]\s*/)
		stage = Math.max(0, Math.ceil((descriptions.length - 1) * fraction))
		state.desc = descriptions[0]
	}
	if (state.isDead) {
		return state.desc
	}
	return descriptions[stage]
}

export {fraction, settings, descriptions}
