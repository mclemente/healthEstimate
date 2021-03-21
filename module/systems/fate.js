const fraction       = function (token) {
	switch (token.actor.data.type) {
		case 'Accelerated': {
			let hitCounter = 6
			for (let [key, value] of Object.entries(token.actor.data.data.health.cons)) {
				if (value.value !== '') {
					hitCounter -= 1
				}
			}
			for (let [key, value] of Object.entries(token.actor.data.data.health.stress)) {
				hitCounter -= 1 * value
			}
			return hitCounter / 6
		}
		case 'Core': {
			//TODO: Add actual logic when necessary variables are added to the token
		}
	}
}
const breakCondition = `||token.actor.data.type !== "Accelerated"`

export {fraction, breakCondition}