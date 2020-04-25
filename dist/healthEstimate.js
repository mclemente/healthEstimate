/**
 * This is your JavaScript entry file for Foundry VTT.
 * Register custom settings, sheets, and constants using the Foundry API.
 * Change this heading to be more descriptive to your module, or remove it.
 * Author: [your name]
 * Content License: [copyright and-or license] If using an existing system
 * 					you may want to put a (link to a) license or copyright
 * 					notice here (e.g. the OGL).
 * Software License: [your license] Put your desired license here, which
 * 					 determines how others may use and modify your module
 */

// Import JavaScript modules
import { registerSettings } from './module/settings.js';
import { preloadTemplates } from './module/preloadTemplates.js';

/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once('init', async function() {
	console.log('healthEstimate | Initializing healthEstimate');
	console.log("%c constructing", "color:orange")

	// Assign custom classes and constants here
	
	// Register custom module settings
	
	// Preload Handlebars templates
	await preloadTemplates();

	// Register custom sheets (if any)
});

/* ------------------------------------ */
/* Setup module							*/
/* ------------------------------------ */
Hooks.once('setup', function() {
	// Do anything after initialization but before
	// ready
	registerSettings();
});

/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */
Hooks.once('ready', function() {
	// Do anything once the module is ready
	class HealthEstimateOverlay extends TokenHUD {
		static get defaultOptions() {
			const options = super.defaultOptions;
			options.classes = options.classes.concat(["healthEstimate"]);
			options.template = "modules/healthEstimate/templates/healthEstimate.hbs";
			options.id = "healthEstimate";
			return options;
		}
		
		// static setPostition() {
		// 	return super.setPostition();
		// }
		
		getData() {
			const data = super.getData();
			data.status = this.estimation;
			data.isOwner = this.owner;
			return data;
		}
	}
	
	class HealthEstimate {
		constructor() {
			this.initHooks();
		}
		initHooks() {
			Hooks.on('renderHeadsUpDisplay', (app, html, data) => {
				html.append('<template id="healthEstimate"></template>');
				canvas.hud.HealthEstimate = new HealthEstimateOverlay();
			});
			
			Hooks.on('hoverToken', (token, hovered) => {
			    this._handleOverlay(token, hovered);
			});
			
			Hooks.on('deleteToken', (...args) => {
				canvas.hud.HealthEstimate.clear();
			})
            Hooks.on('updateToken', (scene, token, ...args) => {
                if (token._id === canvas.hud.HealthEstimate.object.id) {
                	canvas.hud.HealthEstimate.clear();
                }
            })
		}
		_handleOverlay(token, hovered) {
			if (canvas.hud.HealthEstimate === undefined) return;
			if (hovered) {
                this._getEstimation(token);
				canvas.hud.HealthEstimate.owner = token.owner;
				canvas.hud.HealthEstimate.bind(token);
			} else {
				canvas.hud.HealthEstimate.clear();
			}
		}
		_getEstimation(token) {
			const hp = token.actor.data.data.attributes.hp;
			const fraction = Math.min((hp.value + hp.temp) / hp.max, 1);
			const isDead = token.data.overlayEffect === game.settings.get("healthEstimate", "deathMarker");
			const showDead = game.settings.get("healthEstimate", "deathState");
			const showColor = game.settings.get("healthEstimate", "color");
			const descriptions = game.settings.get("healthEstimate", "stateNames").split(/[,;]\s*/);
			const smooth = game.settings.get("healthEstimate","smoothGradient");
			const stage = Math.max(0,Math.ceil((descriptions.length- 1) * fraction));
			const step = smooth ? fraction : stage / (descriptions.length - 1);
			let desc, color, colorShadow;
			
			if (showDead && isDead) {
				desc = game.settings.get("healthEstimate", "deathStateName");
				color = "#000";
				colorShadow = "#F00";
			} else {
				desc = descriptions[stage];
				console.log(desc);
				color = `rgb(${255*(1-step)},${255*step},0)`;
				colorShadow = color;
			}
			canvas.hud.HealthEstimate.estimation = {desc, color, colorShadow, showColor};
		}
	}
	new HealthEstimate();
});

// Add any additional hooks if necessary
