import {breakOverlayRender, descriptionToShow, fractionFormula, updateBreakSettings} from './systemSpecifics.js'
import {sGet} from './utils.js'

export let descriptions, deathStateName, showDead, useColor, smooth, NPCsJustDie, deathMarker, colors, outline, deadColor, deadOutline, perfectionism, outputChat;

export function isDead(token, stage) {
	return (NPCsJustDie && !token.actor.hasPlayerOwner && stage === 0)
		|| (showDead && token.actor.effects.entries.some(x => x.data.icon === deathMarker))
		|| token.getFlag('healthEstimate', 'dead');
}

export function updateSettings () {
	useColor = sGet('core.menuSettings.useColor')
	descriptions = sGet('core.stateNames').split(/[,;]\s*/)
	smooth = sGet('core.menuSettings.smoothGradient')
	deathStateName = sGet('core.deathStateName')
	showDead = sGet('core.deathState')
	NPCsJustDie = sGet('core.NPCsJustDie')
	deathMarker = sGet('core.deathMarker')
	colors = sGet('core.variables.colors')[0]
	outline = sGet('core.variables.outline')[0]
	deadColor = sGet('core.variables.deadColor')
	deadOutline = sGet('core.variables.deadOutline')
	perfectionism = sGet('core.perfectionism')
	outputChat = sGet('core.outputChat')

	const margin = `${sGet('core.menuSettings.positionAdjustment')}em`
	const alignment = sGet('core.menuSettings.position')
	document.documentElement.style.setProperty('--healthEstimate-margin', margin)
	document.documentElement.style.setProperty('--healthEstimate-alignment', alignment)
	document.documentElement.style.setProperty('--healthEstimate-text-size', sGet('core.menuSettings.fontSize'))
}

class HealthEstimateOverlay extends BasePlaceableHUD {
	static get defaultOptions () {
		const options = super.defaultOptions
		options.classes = options.classes.concat(['healthEstimate', 'healthEstimateColor'])
		options.template = 'modules/healthEstimate/templates/healthEstimate.hbs'
		options.id = 'healthEstimate'
		return options
	}

	getData () {
		const data = super.getData()
		data.status = this.estimation
		return data
	}
}

export class HealthEstimate {
	constructor () {
		updateBreakSettings()
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
		if (!token.actor) {
			console.error(`Health Estimate | ${token.name} has no actor.`);
			return;
		}
		if (breakOverlayRender(token) || (!game.user.isGM && token.actor.getFlag('healthEstimate', 'hideHealthEstimate'))) {
			return;
		}
		const width = `${canvas.scene.data.grid * token.data.width}px`
		document.documentElement.style.setProperty('--healthEstimate-width', width)

		if (hovered) {
			this._getEstimation(token)
			canvas.hud.HealthEstimate.bind(token)
		}
		else {
			canvas.hud.HealthEstimate.clear()
		}
	}

	_getEstimation (token) {
		const fraction = Math.min(fractionFormula(token), 1)
		const stage = Math.max(0,
			perfectionism ?
			Math.ceil((descriptions.length - 2 + Math.floor(fraction)) * fraction) :
			Math.ceil((descriptions.length - 1) * fraction),
		)
		const colorIndex = Math.max(0, Math.ceil((colors.length - 1) * fraction))
		let desc, color, stroke

		desc = descriptionToShow(descriptions, stage, token, {
			isDead: isDead(token, stage),
			desc : deathStateName,
		}, fraction)
		color = colors[colorIndex]
		stroke = outline[colorIndex]
		if (isDead(token, stage)) {
			color = deadColor
			stroke = deadOutline
		}
		document.documentElement.style.setProperty('--healthEstimate-stroke-color', stroke)
		document.documentElement.style.setProperty('--healthEstimate-text-color', color)
		canvas.hud.HealthEstimate.estimation = {desc}
	}
}