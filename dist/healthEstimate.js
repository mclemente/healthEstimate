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
		
		static setPostition() {
			return super.setPostition();
		}
		
		getData() {
			const data = super.getData();
			data.status = this.estimation;
			data.isOwner = this.owner;
			return data;
		}
	}
	
	class HealthEstimate {
		constructor() {
			this.descriptions = [ 'Unconcious', 'Near Death', 'Badly Injured', 'Injured', 'Barely Injured', 'Uninjured', 'Dead' ];
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
			// Hooks.on('preUpdateToken', (...args) => {
			// 	canvas.hud.HealthEstimate.clear();
			// })
            Hooks.on('updateToken', (scene, token, change, ... args) => {
            	// canvas.hud.HealthEstimate.setPosition(
            	// 	change.hasOwnProperty("x") ? change.x : token.x,
		        //     change.hasOwnProperty("y") ? change.y : token.y,
                //     scene.data.grid * token.width,
		        //     scene.data.grid * token.height,
				// 	token.scale
	            // )
                if (token._id === canvas.hud.HealthEstimate.object.id) {
                	canvas.hud.HealthEstimate.clear();
                }
            })
		}
		_handleOverlay(token, hovered) {
			if (canvas.hud.HealthEstimate === undefined) return;
			if (hovered /*&& !token.owner*/) {
				let hp = token.actor.data.data.attributes.hp;
				let isDead = token.data.overlayEffect === game.settings.get("healthEstimate", "deathStateName");
				// canvas.hud.HealthEstimate.estimation = this._getEstimatedHealth(hp,isDead);
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
		_getEstimatedHealth(hp,dead) {
			const fraction = Math.min((hp.value + hp.temp) / hp.max, 1);
			let desc, color, colorShadow;
			if (dead) {
				desc = this.descriptions[6];
				color = "rgb(0,0,0)";
				colorShadow = "rgb(255,0,0)"
			} else {
				desc = this.descriptions[Math.max(0,Math.ceil(fraction * 5))];
				color = `rgb(${255*(1-fraction)},${255*fraction},0)`;
				colorShadow = color;
			}
			return {desc, color, colorShadow}
		}
	}
		new HealthEstimate();
});

// Add any additional hooks if necessary
