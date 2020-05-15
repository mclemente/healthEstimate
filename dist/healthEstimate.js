// Import JavaScript modules
import { registerSettings } from './module/settings.js';
import { preloadTemplates } from './module/preloadTemplates.js';
import { getFractionFormula } from "./module/systemSpecifics.js";

/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once('init', async function() {
	console.log('healthEstimate | Initializing healthEstimate');

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
	
	// Have to register Settings here, because doing so at init breaks i18n
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
		
		getData() {
			const data = super.getData();
			data.status = this.estimation;
			data.isOwner = this.owner;
			return data;
		}
	}
	
	class HealthEstimate {
		constructor() {
			this.healthFractionFormula = getFractionFormula();
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
			});
            Hooks.on('updateToken', (scene, token, ...args) => {
                if (canvas.hud.HealthEstimate !== undefined && canvas.hud.HealthEstimate.object !== null) {
                	if (token._id === canvas.hud.HealthEstimate.object.id) {
						canvas.hud.HealthEstimate.clear();
					}
				}
            })
		}
		_handleOverlay(token, hovered) {
			if (
				canvas.hud.HealthEstimate === undefined ||
			    game.keyboard.isDown('Alt') ||
			    (game.settings.get("healthEstimate", "onlyNPCs") && token.actor.isPC) ||
			    (game.settings.get("healthEstimate", "onlyGM")   && !game.user.isGM) ||
				(game.system.id === "fate" && token.actor.data.type !== "Accelerated") //Until other FATE sheets are viable
			   ) return;
			if (hovered) {
                this._getEstimation(token);
				canvas.hud.HealthEstimate.owner = token.owner;
				canvas.hud.HealthEstimate.bind(token);
			} else {
				canvas.hud.HealthEstimate.clear();
			}
		}
		_getEstimation(token) {
			const fraction = Math.min(this.healthFractionFormula(token), 1);
			const isDead = token.data.overlayEffect === game.settings.get("healthEstimate", "deathMarker");
			const showDead = game.settings.get("healthEstimate", "deathState");
			const showColor = game.settings.get("healthEstimate", "color");
			let   descriptions = game.settings.get("healthEstimate", "stateNames").split(/[,;]\s*/);
			const smooth = game.settings.get("healthEstimate","smoothGradient");
			const stage = Math.max(0,Math.ceil((descriptions.length- 1) * fraction));
			const step = smooth ? fraction : stage / (descriptions.length - 1);
			const fontSize = game.settings.get("healthEstimate", "fontSize");
			let desc, color, stroke;
			
			if (
			    (showDead && isDead) ||
				token.getFlag("healthEstimate", "dead")
			   ) {
				desc = game.settings.get("healthEstimate", "deathStateName");
				color = "#900";
				stroke = "#000";
			} else {
				desc   = descriptions[stage];
				color  = (chroma.bezier(['#F00','#0F0']).scale())(step).hex();
				stroke = chroma(color).darken(3);
				switch (game.system.id) {
					case "pf1":
						const hp = token.actor.data.data.attributes.hp;
						if (hp < 1) {
							if (hp === 0) {
								desc = game.settings.get("healthEstimate", "PF1.disabledName");
							} else {
								desc = game.settings.get("healthEstimate", "PF1.dyingName");
							}
						}
						break;
					case "starfinder":
						const type = token.actor.data.type;
						if (type !== "character" || type !== "npc"){
							if (type === "vehicle" && game.settings.get("healthEstimate", "useThreshold")) {
								descriptions = game.settings.get("healthEstimate", "thresholdNames").split(/[,;]\s*/);
							} else {
								descriptions = game.settings.get("healthEstimate", "vehicleNames").split(/[,;]\s*/);
							}
						}
						break;
				}
			}
			if (!showColor) {
				color  = "#FFF";
				stroke = "#000";
			}
			document.documentElement.style.setProperty('--healthEstimate-stroke-color', stroke);
			canvas.hud.HealthEstimate.estimation = {desc, color, fontSize};
		}
	}
	new HealthEstimate();
});

// Add any additional hooks if necessary
