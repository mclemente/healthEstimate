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
		const data = {
			bezier: game.settings.get('healthEstimate', 'bezier')
		}

		return {}
	}

	initHooks () {
		Hooks.on('renderHealthEstimateColorSettings', () => {
			const gradientPositions = game.settings.get(`healthEstimate`, `core.colorSettings.gradient`)
			const bezier            = document.getElementById(`bezier`)
			const correctLightness  = document.getElementById(`correctLightness`)
			const mode              = document.getElementById(`mode`)

			this.gradFn = new Function()
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
			for (const v of [bezier, correctLightness, mode]) {
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
		const correctLightness = document.getElementById(`correctLightness`).checked
		const mode             = document.getElementById(`mode`).value
		const colorHandler     = bezier
		                         ? `bezier(colors).scale()`
		                         : `scale(colors)`
		let lightness          = ``

		if (correctLightness) {
			lightness = `.correctLightness()`
		}

		this.gradFn = new Function(
			`position`, `colors`, `colorPositions`,
			`return (chroma.${colorHandler}${lightness}.domain(colorPositions).mode('${mode}'))(position/100).hex()`
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