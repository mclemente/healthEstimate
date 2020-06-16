import {sGet, sSet, settingData} from './utils.js'

export class HealthEstimateColorSettings extends FormApplication {

	constructor (object, options = {}) {
		super(object, options)
		this.initHooks()
	}

	/**
	 * Default Options for this FormApplication
	 */
	static get defaultOptions () {
		return mergeObject(super.defaultOptions, {
			id           : 'healthestimate-colors-form',
			title        : 'Health Estimate Color Settings',
			template     : './modules/healthEstimate/templates/settings.hbs',
			classes      : ['sheet'],
			width        : 600,
			height       : 300,
			closeOnSubmit: true
		})
	}

	getData (options) {
		function path (key) {
			return `core.colorSettings.${key}`
		}
		function prepSelection(key) {
			let data = settingData(path(key))
			let current = sGet(path(key))
			let result = []
			for (let [k,v] of Object.entries(data.choices)) {
				result.push({
					key: k,
					value: v,
					selected: k === current
				})
			}
			return result
		}
		function prepSetting (key) {
			let data = settingData(path(key))
			return {
				value: sGet(path(key)),
				name: data.name,
				hint: data.hint
			}
		}

		return {
			useColor        : prepSetting('color'),
			smoothGradient  : prepSetting('smoothGradient'),
			bezier          : prepSetting('bezier'),
			correctLightness: prepSetting('correctLightness'),
			deadColor       : prepSetting('deadColor'),
			mode            : prepSelection('mode'),
			outline         : prepSelection('outline')
		}
	}

	initHooks () {
		Hooks.on('renderHealthEstimateColorSettings', () => {
			const gradientPositions = game.settings.get(`healthEstimate`, `core.colorSettings.gradient`)
			const bezier            = document.getElementById(`bezier`)
			const mode              = document.getElementById(`mode`)

			this.gradFn = new Function()
			this.gradCl = new Function()
			this.gradEx = document.getElementById('gradientExampleHE')
			this.gp     = this.gp || new Grapick({el: '#gradientControlsHE'})
			this.setHandlers(gradientPositions).then(() => {
				this.updateGradientFunction()
			})
			// this.gp.addHandler(0, "#f00")
			// this.gp.addHandler(100, "#00f")
			this.gp.on('change', complete => {
				this.updateGradient()
			})
			for (const v of [bezier, mode]) {
				v.addEventListener(`change`, () => {
					this.updateGradientFunction()
				})
			}

		})
	}

	async setHandlers (positions) {
		for (let [i, v] of positions.colors.entries()) {
			await this.gp.addHandler(positions.positions[i] * 100, v)
		}
		// return(`!`)
	}

	updateGradientFunction () {
		const bezier           = document.getElementById(`bezier`).checked
		const mode             = document.getElementById(`mode`).value
		const colorHandler     = bezier
		                         ? `bezier(colors).scale()`
		                         : `scale(colors)`


		this.gradFn = new Function(
			`position`, `colors`, `colorPositions`,
			`return (chroma.${colorHandler}.domain(colorPositions).mode('${mode}'))(position/100).hex()`
		)
		this.gradCl = new Function(
			`amount`, `colors`, `colorPositions`,
			`return (chroma.${colorHandler}.domain(colorPositions).mode('${mode}').colors(amount))`
		)
		this.updateGradient()
	}

	updateGradient () {
		// const colors = this.gp.handlers.map(a => a.color)
		// const positions = this.gp.handlers.map(a => Math.round(a.position) / 100)
		const colors         = this.gp.handlers.map(a => a.color)
		const colorPositions = this.gp.handlers.map(a => Math.round(a.position) / 100)
		let gradString       = ''
		for (let i = 0; i < 100; i++) {
			gradString +=
				`<span style="
        			display:inline-block;
        			height:25px;
        			width:1%;
        			background-color:${this.gradFn(i, colors, colorPositions)};"></span>`
		}
		// (chroma.bezier(colors).scale().domain(positions).mode('cmyk'))(i / 100).hex()
		this.gradEx.innerHTML = gradString
	}
}