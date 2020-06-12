import {t} from '../utils.js'

const fraction = function (token) {
	/* Can't think of a different way to do it that doesn't involve FS manipulation, which is its own can of worms */
	const setting = game.settings.get('healthEstimate', 'worldbuilding.simpleRule')
	return Function('token', setting)(token)
}
const settings = () => {
	return {
		'worldbuilding.simpleRule': {
			type   : String,
			default: t('worldbuilding.simpleRule.default'),
		}
	}
}

export {fraction, settings}