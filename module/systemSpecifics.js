import {isEmpty, sGet} from './utils.js'
import {addSetting} from './settings.js'
import {updateSettings} from './logic.js'

export let fractionFormula
export let breakOverlayRender
export let systemSpecificSettings = {}

/**
 * Function handling which description to show. Can be overriden by a system-specific implementation
 * @param {String[]} descriptions
 * @param {Number} stage
 * @param {Token} token
 * @param state
 * @returns {*}
 */
export let descriptionToShow = function
	(
		descriptions,
		stage,
		token,
		state = {isDead: false, desc: ''},
		fraction,
	) {
	if (state.isDead) {
		return state.desc
	}
	return descriptions[stage]
}

const tempHPSetting = {
	type   : Boolean,
	default: false,
}

let breakConditions = {
	'default': `game.keyboard.isDown('Alt')`,
}

function updateBreakConditions () {
	function prep (key) {
		if (isEmpty(breakConditions[key])) {
			return ''
		} else {
			return breakConditions[key]
		}
	}

	breakOverlayRender = function (token) {
		return new Function(`token`,
			`return (
				${prep('default')}
				${prep('onlyGM')} 
				${prep('onlyNotGM')} 
				${prep('onlyNPCs')}
				${prep('onlyPCs')}
				${prep('system')}
			)`
		)(token)
	}
}

export function updateBreakSettings () {
	breakConditions['onlyGM'] = sGet('core.showDescription') == 1 ? `|| !game.user.isGM` : ``
	breakConditions['onlyNotGM']   = sGet('core.showDescription') == 2 ? `|| game.user.isGM` : ``
	breakConditions['onlyNPCs'] = sGet('core.showDescription') == 3 ? `|| (!game.user.isGM && token.actor.hasPlayerOwner)` : ``
	breakConditions['onlyPCs']  = sGet('core.showDescription') == 4 ? `|| (!game.user.isGM && !token.actor.hasPlayerOwner)` : ``
	updateBreakConditions()
}

export function prepareSystemSpecifics () {
	return new Promise((resolve, reject) => {
		const systems = ["archmage", "blades-in-the-dark", "CoC7", "D35E", "dnd5e", "dungeonworld", "fate", "foundryvtt-reve-de-dragon", "lancer", "numenera", "ose", "pf1", "pf2e", "ryuutama", "shadowrun5e", "starfinder", "starwarsffg", "sw5e", "swade", "symbaroum", "tormenta20", "twodsix", "uesrpg-d100", "wfrp4e", "worldbuilding"];
		let importString = `./systems/${game.system.id}.js`;
		if (!systems.includes(game.system.id)) {
			importString = `./systems/generic.js`;
		}
		import(importString)
		.then(currentSystem => {
			fractionFormula = currentSystem.fraction
			if (currentSystem.settings !== undefined) {
				/*
				 * currentSystem.settings is a function because doing it otherwise causes
				 * l18n calls fire before they're initialized.
				 */
				systemSpecificSettings = Object.assign(systemSpecificSettings, currentSystem.settings())
			}
			if (currentSystem.breakCondition !== undefined) {
				breakConditions['system'] = currentSystem.breakCondition
			}
			if (currentSystem.descriptions !== undefined) {
				descriptionToShow = currentSystem.descriptions
			}
			for (let [key, data] of Object.entries(systemSpecificSettings)) {
				addSetting(key, data)
			}
			resolve('success')
		})
	})
}
