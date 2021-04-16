const fraction = function (token) {
	const hp = token.actor.data.data.attributes.hp
	let temp = 0
	if (token.actor.data.type === 'character' && game.settings.get('healthEstimate', 'core.addTemp')) {
		temp = hp.temp
	}
	return Math.min((temp + hp.value) / hp.max, 1)
}
const settings = () => {
	return {
		'core.addTemp'         : {
			type   : Boolean,
			default: false,
		},
		'core.breakOnZeroMaxHP': {
			type   : Boolean,
			default: true,
		},
	}
}

const breakCondition = `||game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.data.data.attributes.hp.max === 0`

export {fraction, settings, breakCondition}