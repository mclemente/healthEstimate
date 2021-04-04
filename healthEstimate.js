// Import JavaScript modules
import {registerSettings} from './module/settings.js'
import {preloadTemplates} from './module/preloadTemplates.js'
import {descriptionToShow, fractionFormula, prepareSystemSpecifics} from "./module/systemSpecifics.js"
import {HealthEstimate, HealthEstimateInfos} from "./module/logic.js"

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

// Add any additional hooks if necessary
var current_hp_actor = {}; //store hp of PC
var infos = {};

//HP storing code for canvas load or token created
Hooks.on('canvasReady', function(){
	infos = HealthEstimateInfos();
	let tokens = canvas.tokens.placeables.filter(e => e.actor);
	for (let actor of tokens) {
		const fraction = Math.min(fractionFormula(actor), 1)
		const stage = Math.max(0,
			infos.perfectionism ?
			Math.ceil((infos.descriptions.length - 2 + Math.floor(fraction)) * fraction) :
			Math.ceil((infos.descriptions.length - 1) * fraction),
		)
		current_hp_actor[actor.data._id] = {'name': actor.data.name, 'stage':stage};
	}
});

Hooks.on('createToken', function(){
	infos = HealthEstimateInfos();
	let tokens = canvas.tokens.placeables.filter(e => e.actor);
	for (let actor of tokens) {
		const fraction = Math.min(fractionFormula(actor), 1)
		const stage = Math.max(0,
			infos.perfectionism ?
			Math.ceil((infos.descriptions.length - 2 + Math.floor(fraction)) * fraction) :
			Math.ceil((infos.descriptions.length - 1) * fraction),
		)
		current_hp_actor[actor.data._id] = {'name': actor.data.name, 'stage':stage};
	}
});	

//spam in chat if token (NPC) is updated
Hooks.on("updateToken", (scene, token, updateData, options, userId) => {
	infos = HealthEstimateInfos();
	let chatData = "";
	if(game.user.isGM && infos.outputChat) { //only the USER that promoted the change will spam the message
		var math = {};
		/*start collectting all PNC hp information*/	
		let actors = canvas.tokens.placeables.filter(e=> e.actor);
		for (let actor of actors) {
			const fraction = Math.min(fractionFormula(actor), 1)
			const stage = Math.max(0,
				infos.perfectionism ?
				Math.ceil((infos.descriptions.length - 2 + Math.floor(fraction)) * fraction) :
				Math.ceil((infos.descriptions.length - 1) * fraction),
			)
			math[actor.data._id] = {'name': actor.data.name, 'stage':stage};
			if (math[actor.data._id].stage != current_hp_actor[actor.data._id].stage) {
				let name = math[actor.data._id].name;
				if (actor.getFlag('healthEstimate', 'hideHealthEstimate') && actor.data.displayName==0) {
					name = "Unknown entity";
				}
				let css = "<span class='hm_messagetaken'>";
				if (math[actor.data._id].stage < current_hp_actor[actor.data._id].stage) {
					css = "<span class='hm_messageheal'>"
				}
				chatData = {
					content: (css + name + " is now " + infos.descriptions[math[actor.data._id].stage] + ".</span>")
				};
				ChatMessage.create(chatData, {});	
			}
		}
		chatData = "";
	}
});

//spam in chat if the actor is updated
Hooks.on('updateActor', (data, options, apps, userId) => {
	infos = HealthEstimateInfos();
	let chatData = "";
	if(game.user.isGM && infos.outputChat) { //only the USER that promoted the change will spam the message
		var math = {};
		/*start collectting all PNC hp information*/	
		let actors = canvas.tokens.placeables.filter(e=> e.actor && e.actor.data.type==='character');
		for (let actor of actors) {
			const fraction = Math.min(fractionFormula(actor), 1)
			const stage = Math.max(0,
				infos.perfectionism ?
				Math.ceil((infos.descriptions.length - 2 + Math.floor(fraction)) * fraction) :
				Math.ceil((infos.descriptions.length - 1) * fraction),
			)
			math[actor.data._id] = {'name': actor.data.name, 'stage':stage};
			if (math[actor.data._id].stage != current_hp_actor[actor.data._id].stage) {
				let name = math[actor.data._id].name;
				if (actor.getFlag('healthEstimate', 'hideHealthEstimate') && actor.data.displayName == 0) {
					name = "Unknown entity";
				}
				let css = "<span class='hm_messagetaken'>";
				if (math[actor.data._id].stage < current_hp_actor[actor.data._id].stage) {
					css = "<span class='hm_messageheal'>"
				}
				chatData = {
					content: (css + name + " is now " + infos.descriptions[math[actor.data._id].stage] + ".</span>")
				};
				ChatMessage.create(chatData, {});	
			}
		}
		chatData = "";
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
		html.find(".message-sender").text("");	
		html.find(".message-metadata")[0].style.display = "none";
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
		html.find(".message-sender").text("");	
		html.find(".message-metadata")[0].style.display = "none";
	}
});
	
