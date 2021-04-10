// Import JavaScript modules
import {registerSettings} from './module/settings.js'
import {preloadTemplates} from './module/preloadTemplates.js'
import {descriptionToShow, fractionFormula, prepareSystemSpecifics} from "./module/systemSpecifics.js"
import {HealthEstimate, descriptions, deathStateName, isDead, outputChat, perfectionism, updateSettings} from "./module/logic.js"
import {t} from "./module/utils.js"

// Add any additional hooks if necessary
var current_hp_actor = {}; //store hp of PC

function getCharacters(actors) {
	for (let actor of actors) {
		const fraction = Math.min(fractionFormula(actor), 1)
		const stage = Math.max(0,
			perfectionism ?
			Math.ceil((descriptions.length - 2 + Math.floor(fraction)) * fraction) :
			Math.ceil((descriptions.length - 1) * fraction),
		)
		current_hp_actor[actor.data._id] = {'name': actor.data.name, 'stage':stage, 'dead':isDead(actor, stage)};
	}
}

function outputStageChange(actors) {
	for (let actor of actors) {
		const fraction = Math.min(fractionFormula(actor), 1)
		const stage = Math.max(0,
			perfectionism ?
			Math.ceil((descriptions.length - 2 + Math.floor(fraction)) * fraction) :
			Math.ceil((descriptions.length - 1) * fraction),
		)
		const dead = isDead(actor, stage);
		if (stage != current_hp_actor[actor.data._id].stage || dead != current_hp_actor[actor.data._id].dead) {
			let name = current_hp_actor[actor.data._id].name;
			if (actor.getFlag('healthEstimate', 'hideHealthEstimate') && actor.data.displayName==0) {
				name = "Unknown entity";
			}
			let css = "<span class='hm_messagetaken'>";
			if (stage > current_hp_actor[actor.data._id].stage) {
				css = "<span class='hm_messageheal'>"
			}
			let desc = descriptionToShow(descriptions, stage, actor, {
				isDead: dead,
				desc : deathStateName,
			}, fraction);
			let chatData = {
				content: (css + name + " " + t("core.isNow") + " " + desc + ".</span>")
			};
			ChatMessage.create(chatData, {});
			current_hp_actor[actor.data._id].stage = stage;
			current_hp_actor[actor.data._id].dead = dead;
		}
	}
}

/* ------------------------------------ */
/* Initialize module		*/
/* ------------------------------------ */
Hooks.once('init', async function () {
	console.log('healthEstimate | Initializing healthEstimate')
	// CONFIG.debug.hooks = true
	
	// Assign custom classes and constants here
	
	// Register custom module settings
	
	// Preload Handlebars templates
	await preloadTemplates()
	
	// Register custom sheets (if any)
	Hooks.on('renderHeadsUpDisplay', (app, html, data) => {
	html.append('<template id="healthEstimate"></template>')
	})
	
})

/* ------------------------------------ */
/* Setup module		*/
/* ------------------------------------ */
Hooks.once('setup', function () {
	// Do anything after initialization but before
	// ready

	// Have to register Settings here, because doing so at init breaks i18n
	prepareSystemSpecifics().then(registerSettings())
})

/* ------------------------------------ */
/* When ready		*/
/* ------------------------------------ */
Hooks.once('ready', function () {
	// Do anything once the module is ready
	
	new HealthEstimate()
})

//HP storing code for canvas load or token created
Hooks.on('canvasReady', function(){
	let tokens = canvas.tokens.placeables.filter(e => e.actor);
	updateSettings();
	getCharacters(tokens)
});

Hooks.on('createToken', function(){
	let tokens = canvas.tokens.placeables.filter(e => e.actor);
	getCharacters(tokens)
});	

//spam in chat if token (NPC) is updated
Hooks.on("updateToken", (scene, token, updateData, options, userId) => {
	if(game.user.isGM && outputChat) { //only the USER that promoted the change will spam the message
		/*start collectting all PNC hp information*/	
		let actors = canvas.tokens.placeables.filter(e=> e.actor);
		outputStageChange(actors);
	}
});

//spam in chat if the actor is updated
Hooks.on('updateActor', (data, options, apps, userId) => {
	if(game.user.isGM && outputChat) { //only the USER that promoted the change will spam the message
		/*start collectting all PNC hp information*/	
		let actors = canvas.tokens.placeables.filter(e=> e.actor && e.actor.data.type==='character');
		outputStageChange(actors);
	}
});	

// This is for chat styling
Hooks.on("renderChatMessage", (app, html, data) => { 
	if (html.find(".hm_messageheal").length) {
		html.css("background", "#06a406");
		html.css("text-shadow", "-1px -1px 0 #000 , 1px -1px 0 #000 , -1px 1px 0 #000 , 1px 1px 0 #000");
		html.css("color", "white");
		html.css("text-align", "center");
		html.css("font-size", "12px");
		html.css("margin", "2px");
		html.css("padding", "2px");
		html.css("border", "2px solid #191813d6");
		// html.find(".message-sender").text("");
		// html.find(".message-metadata")[0].style.display = "none";
	}
	if (html.find(".hm_messagetaken").length) {
		html.css("background", "#c50d19");
		html.css("text-shadow", "-1px -1px 0 #000 , 1px -1px 0 #000 , -1px 1px 0 #000 , 1px 1px 0 #000");
		html.css("color", "white");
		html.css("text-align", "center");
		html.css("font-size", "12px");
		html.css("margin", "2px");
		html.css("padding", "2px");
		html.css("border", "2px solid #191813d6");
		// html.find(".message-sender").text("");
		// html.find(".message-metadata")[0].style.display = "none";
	}
});
	
