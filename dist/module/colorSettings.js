import {sGet, sSet, settingData} from './utils.js'

export class HealthEstimateColorSettings extends FormApplication {

	constructor (object, options = {}) {
		super(object, options)
		this.gradFn     = new Function()
		this.gradColors = []
		Hooks.once('renderHealthEstimateColorSettings', this.initHooks.bind(this))
		Hooks.once('closeHealthEstimateColorSettings', () => {delete this.gp})
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
			height       : 800,
			closeOnSubmit: true
		})
	}

	getData (options) {
		function path (key) {
			return `core.colorSettings.${key}`
		}

		function prepSelection (key, param = false) {
			let data    = settingData(path(key))
			let current = ''
			let result  = {
				select: [],
				name  : data.name,
				hint  : data.hint
			}

			if (param) {
				let currentObject = sGet(path(key))
				current           = currentObject[param]
				// for (let [k, v] of Object.entries((currentObject))) {
				// 	result[k] = v
				// }
				Object.assign(result, currentObject)
			} else {
				current = sGet(path(key))
			}

			for (let [k, v] of Object.entries(data.choices)) {
				result.select.push({
					key     : k,
					value   : v,
					selected: k === current
				})
			}
			return result
		}

		function prepSetting (key) {
			let data = settingData(path(key))
			return {
				value: sGet(path(key)),
				name : data.name,
				hint : data.hint
			}
		}

		return {
			useColor      : prepSetting('color'),
			smoothGradient: prepSetting('smoothGradient'),
			bezier        : prepSetting('bezier'),
			deadColor     : prepSetting('deadColor'),
			mode          : prepSelection('mode'),
			outline       : prepSelection('outline', 'mode')
		}
	}

	initHooks () {
		const gradientPositions = game.settings.get(`healthEstimate`, `core.colorSettings.gradient`)
		const bezier            = document.getElementById(`bezier`)
		const mode              = document.getElementById(`mode`)
		const deadColor         = document.getElementById('deadColor')
		console.warn (this)

		this.smoothGradient = document.getElementById('smoothGradient')
		this.gradEx         = document.getElementById('gradientExampleHE')
		this.gp             = new Grapick({
			el     : '#gradientControlsHE',
			colorEl: '<input id="colorpicker"/>'
		})
		this.gp.setColorPicker(handler => {
			const el = handler.getEl().querySelector('#colorpicker')

			$(el).spectrum({
				color    : handler.getColor(),
				showAlpha: true,
				change (color) {
					handler.setColor(color.toRgbString())
				},
				move (color) {
					handler.setColor(color.toRgbString(), 0)
				}
			})
		})
		this.setHandlers(gradientPositions).then(() => {
			this.updateGradientFunction()
		})

		$(deadColor).spectrum({
			color: sGet('core.colorSettings.deadColor'),
			change (color) {
				deadColor.value = color.toRgbString()
			}
		})

		this.gp.on('change', complete => {
			this.updateGradient()
		})
		for (const v of [bezier, mode]) {
			v.addEventListener(`change`, () => {
				this.updateGradientFunction()
			})
		}
		this.smoothGradient.addEventListener('change', () => {
			this.updateGradient()
		})
	}

	async setHandlers (positions) {
		for (let [i, v] of positions.colors.entries()) {
			this.gp.addHandler(positions.positions[i] * 100, v)
		}
	}

	updateGradientFunction () {
		const bezier       = document.getElementById(`bezier`).checked
		const mode         = document.getElementById(`mode`).value
		const colorHandler = bezier ? `bezier(colors).scale()` : `scale(colors)`

		// this.gradFn = new Function(
		// 	`position`, `colors`, `colorPositions`,
		// 	`return (chroma.${colorHandler}.domain(colorPositions).mode('${mode}'))(position/100).hex()`
		// )
		this.gradFn = new Function(
			`amount`, `colors`, `colorPositions`,
			`return (chroma.${colorHandler}.domain(colorPositions).mode('${mode}').colors(amount))`
		)
		this.updateGradient()
	}

	updateGradient () {
		const colors         = this.gp.handlers.map(a => a.color)
		const colorPositions = this.gp.handlers.map(a => Math.round(a.position) / 100)
		const gradLength     = this.smoothGradient.checked ? 100 : sGet('core.stateNames').split(/[,;]\s*/).length
		const width          = 100 / gradLength
		this.gradColors      = this.gradFn(gradLength, colors, colorPositions)
		let gradString       = ''

		for (let i = 0; i < gradLength; i++) {
			gradString +=
				`<span style="
        			display:inline-block;
        			height:30px;
        			width:${width}%;
        			background-color:${this.gradColors[i]};"></span>`
		}
		// (chroma.bezier(colors).scale().domain(positions).mode('cmyk'))(i / 100).hex()
		this.gradEx.innerHTML = gradString
	}
}