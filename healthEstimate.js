// Import JavaScript modules
import {registerSettings}       from './module/settings.js'
import {preloadTemplates}       from './module/preloadTemplates.js'
import {prepareSystemSpecifics} from "./module/systemSpecifics.js"
import {HealthEstimate}         from "./module/logic.js"

/* ------------------------------------ */
/* Initialize module					*/
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
/* Setup module							*/
/* ------------------------------------ */
Hooks.once('setup', function () {
	// Do anything after initialization but before
	// ready

	// Have to register Settings here, because doing so at init breaks i18n
	prepareSystemSpecifics().then(registerSettings())
})

/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */
Hooks.once('ready', function () {
	// Do anything once the module is ready
	
	new HealthEstimate()
})

// Add any additional hooks if necessary
