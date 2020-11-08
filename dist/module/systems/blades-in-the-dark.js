import {isEmpty} from '../utils.js'

const fraction       = function (token) {
	const hp      = token.actor.data.data.harm
	let harmLevel = 0
	for (let [key, value] of Object.entries(hp)) {
		for (let entry of Object.values(value)) {
			if (!isEmpty(entry)) {  //Testing for empty or whitespace
				switch (key) {
					case 'light':
						harmLevel += 1
						break
					case 'medium':
						harmLevel += 3
						break
					case 'heavy':
						harmLevel += 9
						break
					case 'deadly':
						return 0
				}
			}
		}
	}
	return 1 - (harmLevel / 18)
}
const breakCondition = `||token.actor.data.type === "crew"`

export {fraction, breakCondition}