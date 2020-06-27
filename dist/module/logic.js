import {breakOverlayRender, descriptionToShow, fractionFormula, updateBreakSettings} from './systemSpecifics.js'
import {sGet} from './utils.js'

let descriptions, deathStateName, showDead, showColor, smooth, isDead

export function updateSettings () {
	showColor       = sGet('core.menuSettings.color')
	descriptions    = sGet('core.stateNames').split(/[,;]\s*/)
	smooth          = sGet('core.menuSettings.smoothGradient')
	deathStateName  = sGet('core.deathStateName')
	let showDead    = sGet('core.deathState')
	let NPCsJustDie = sGet('core.NPCsJustDie')
	let deathMarker = sGet('core.deathMarker')

	isDead = new Function(
		'token', 'stage',
		`return (
			${NPCsJustDie ? 'stage === 0 ||' : ''}
			${showDead ? `token.data.overlayEffect === '${deathMarker}' ||` : ''}
			token.getFlag('healthEstimate', 'dead')
		)`
	)
}

class HealthEstimateOverlay extends TokenHUD {
	static get defaultOptions () {
		const options    = super.defaultOptions
		options.classes  = options.classes.concat(['healthEstimate', 'healthEstimateColor'])
		options.template = 'modules/healthEstimate/templates/healthEstimate.hbs'
		options.id       = 'healthEstimate'
		return options
	}

	getData () {
		const data  = super.getData()
		data.status = this.estimation
		return data
	}
}

export class HealthEstimate {
	constructor () {
		updateBreakSettings()
		document.documentElement.style.setProperty('--healthEstimate-text-size', sGet('core.menuSettings.fontSize'))
		canvas.hud.HealthEstimate = new HealthEstimateOverlay()
		updateSettings()
		this.initHooks()
	}


	initHooks () {
		Hooks.on('hoverToken', (token, hovered) => {
			this._handleOverlay(token, hovered)
		})

		Hooks.on('deleteToken', (...args) => {
			canvas.hud.HealthEstimate.clear()
		})
		Hooks.on('updateToken', (scene, token, ...args) => {
			if (canvas.hud.HealthEstimate !== undefined && canvas.hud.HealthEstimate.object !== null) {
				if (token._id === canvas.hud.HealthEstimate.object.id) {
					canvas.hud.HealthEstimate.clear()
				}
			}
		})
	}

	_handleOverlay (token, hovered) {
		if (breakOverlayRender(token)) {
			return
		}
		if (hovered) {
			this._getEstimation(token)
			canvas.hud.HealthEstimate.bind(token)
		} else {
			canvas.hud.HealthEstimate.clear()
		}
	}

	_getEstimation (token) {
		const fraction = Math.min(fractionFormula(token), 1)
		// const isDead   = token.data.overlayEffect === deathMarker
		const stage    = Math.max(0, Math.ceil((descriptions.length - 1) * fraction))
		const step     = smooth ? fraction : stage / (descriptions.length - 1)
		let desc, color, stroke

		desc = descriptionToShow(descriptions, stage, token, {isDead: isDead(token, stage), desc: deathStateName})
		if (isDead(token, stage)) {
			// desc   = deathStateName
			color  = '#900'
			stroke = '#000'
		} else {
		}
		if (showColor) {
			color  = color || (chroma.bezier(['#F00', '#0F0']).scale())(step).hex()
			stroke = stroke || chroma(color).darken(3)
		} else {
			color  = '#FFF'
			stroke = '#000'
		}
		document.documentElement.style.setProperty('--healthEstimate-stroke-color', stroke)
		document.documentElement.style.setProperty('--healthEstimate-text-color', color)
		canvas.hud.HealthEstimate.estimation = {desc}
	}
}
