import {t} from '../utils.js'

const fraction = (token) => {
	const data = token.actor.data
	const hp   = data.type === 'deployable' ? data.data.hp : data.data.mech.hp
	return hp.value / hp.max
}

const settings = () => {
	return {
		'core.breakOnZeroMaxHP': {
			type   : Boolean,
			default: true,
		},
		'core.stateNames': {
			config : true,
			scope  : 'world',
			type   : String,
			default: t('starfinder.vehicleNames.default').join(', ')
		}
	}
}

const breakCondition = `
	|| game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') 
	&& (token.actor.data.data.mech?.hp.max === 0
	   || token.actor.data.data.hp?.max    === 0)
`

export {fraction, settings, breakCondition}