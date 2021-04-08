import {sGet, sSet, settingData} from './utils.js'
import {updateSettings} from './logic.js'

export class HealthEstimateDeathSettings extends FormApplication {

	constructor (object, options = {}) {
		super(object, options)
		this.gradFn = new Function()
		this.gradColors = []
	}

	/**
	 * Default Options for this FormApplication
	 */
	static get defaultOptions () {
		return mergeObject(super.defaultOptions, {
			id : 'healthestimate-death-form',
			title : 'Health Estimate Death Settings',
			template : './modules/healthEstimate/templates/deathSettings.hbs',
			classes : ['sheet'],
			width : 640,
			height : "auto",
			closeOnSubmit: true
		})
	}

	getData (options) {

		function prepSetting (key) {
			let data = settingData(`core.${key}`)
			return {
				value: sGet(`core.${key}`),
				name : data.name,
				hint : data.hint
			}
		}

		return {
			deathState : prepSetting('deathState'),
			deathStateName : prepSetting('deathStateName'),
			NPCsJustDie : prepSetting('NPCsJustDie'),
			deathMarker : prepSetting('deathMarker'),
		}
	}

	/**
	 * Executes on form submission
	 * @param {Event} e - the form submission event
	 * @param {Object} d - the form data
	 */
	async _updateObject(e,d) {
		const iterableSettings = Object.keys(d);
		for (let key of iterableSettings) {
			sSet(`core.${key}`, d[key]);
		}
	}
}