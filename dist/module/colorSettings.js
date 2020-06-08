export class HealthEstimateColorSettings extends FormApplication {
	
	constructor(object, options = {}) {
		super(object, options)
		this.initHooks()
		
	}
	
	/**
	 * Default Options for this FormApplication
	 */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id:            "healthestimate-colors-form",
			title:         "Health Estimate Color Settings",
			template:      "./modules/healthEstimate/templates/settings.hbs",
			classes:       ["sheet"],
			width:         600,
			height:        300,
			closeOnSubmit: true
		})
	}
	
	getData(options) {
		return {}
	}
	
	initHooks() {
		Hooks.on('renderHealthEstimateColorSettings', () => {
			this.gradEx = document.getElementById("gradientExampleHE")
			this.gp     = new Grapick({el: '#gradientControlsHE'})
			this.gp.addHandler(0, "#f00")
			this.gp.addHandler(100, "#00f")
			this.gp.on('change', complete => {
				this.updateGradient(
					this.gp.handlers.map(a => a.color),
					this.gp.handlers.map(a => Math.round(a.position) / 100)
				)
			})
			this.updateGradient()
		})
	}
	
	updateGradient(colors = ["#f00", "#00f"], locations = [0, 1]) {
		let gradString = ''
		for (let i = 0; i < 100; i++) {
			gradString += `<span style="display:inline-block;height:25px;width:1%;background-color:${
				(chroma.bezier(colors).scale().domain(locations).mode('cmyk'))(i / 100).hex()
			};"></span>`
		}
		this.gradEx.innerHTML = gradString
	}
}