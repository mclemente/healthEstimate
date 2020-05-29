import {breakOverlayRender, descriptionToShow, fractionFormula, updateBreakSettings} from "./systemSpecifics.js"

let descriptions, deathMarker, deathStateName, showDead, showColor, smooth

export function updateSettings() {
	showColor      = game.settings.get("healthEstimate", "core.color")
	descriptions   = game.settings.get("healthEstimate", "core.stateNames").split(/[,;]\s*/)
	smooth         = game.settings.get("healthEstimate", "core.smoothGradient")
	deathStateName = game.settings.get("healthEstimate", "core.deathStateName")
	showDead       = game.settings.get("healthEstimate", "core.deathState")
	deathMarker    = game.settings.get("healthEstimate", "core.deathMarker")
}

class HealthEstimateOverlay extends TokenHUD {
	static get defaultOptions() {
		const options    = super.defaultOptions
		options.classes  = options.classes.concat(["healthEstimate"])
		options.template = "modules/healthEstimate/templates/healthEstimate.hbs"
		options.id       = "healthEstimate"
		return options
	}
	
	getData() {
		const data  = super.getData()
		data.status = this.estimation
		return data
	}
}

export class HealthEstimate {
	constructor() {
		updateBreakSettings()
		document.documentElement.style.setProperty('--healthEstimate-text-size', game.settings.get("healthEstimate", "core.fontSize"))
		canvas.hud.HealthEstimate = new HealthEstimateOverlay()
		updateSettings()
		this.initHooks()
	}
	
	
	initHooks() {
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
	
	_handleOverlay(token, hovered) {
		if (breakOverlayRender(token)) return
		if (hovered) {
			this._getEstimation(token)
			canvas.hud.HealthEstimate.bind(token)
		} else {
			canvas.hud.HealthEstimate.clear()
		}
	}
	
	_getEstimation(token) {
		const fraction = Math.min(fractionFormula(token), 1)
		const isDead   = token.data.overlayEffect === deathMarker
		const stage    = Math.max(0, Math.ceil((descriptions.length - 1) * fraction))
		const step     = smooth ? fraction : stage / (descriptions.length - 1)
		let desc, color, stroke
		
		if (
			(showDead && isDead) ||
			token.getFlag("healthEstimate", "dead")
		) {
			desc   = deathStateName
			color  = "#900"
			stroke = "#000"
		} else {
			desc = descriptionToShow(descriptions, stage, token)
		}
		if (showColor) {
			color  = color || (chroma.bezier(['#F00', '#0F0']).scale())(step).hex()
			stroke = stroke || chroma(color).darken(3)
		} else {
			color  = "#FFF"
			stroke = "#000"
		}
		document.documentElement.style.setProperty('--healthEstimate-stroke-color', stroke)
		document.documentElement.style.setProperty('--healthEstimate-text-color', color)
		canvas.hud.HealthEstimate.estimation = {desc}
	}
}
