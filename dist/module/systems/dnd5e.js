import {addTemp, breakOnZeroMaxHP} from './commonSettings.js'

const fraction = function (token) {
	const hp    = token.actor.data.data.attributes.hp
	let addTemp = 0
	if (token.actor.data.type === 'character' && game.settings.get('healthEstimate', 'core.addTemp')) {
		addTemp = 1
	}
	return Math.min((hp.temp * addTemp + hp.value) / hp.max, 1)
}
const settings = () => {return Object.assign({}, addTemp, breakOnZeroMaxHP)}

const breakCondition = `||game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.data.data.attributes.hp.max === 0`

export {fraction, settings, breakCondition}