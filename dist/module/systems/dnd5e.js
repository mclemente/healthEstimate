const fraction = function (token) {
	const hp = token.actor.data.data.attributes.hp
	let addTemp = 0
	if (token.actor.data.type === "character" && game.settings.get("healthEstimate", "core.addTemp")) addTemp = 1
	return Math.min((hp.temp * addTemp + hp.value) / hp.max, 1)
}
const settings = ()=> {
	return {
		"core.addTemp": {
			type:    Boolean,
			default: false,
		}
	}
}

export {fraction, settings}