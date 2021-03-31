export const preloadTemplates = async function () {
	const templatePaths = [
		// Add paths to "modules/healthestimate/templates"
		'modules/healthestimate/templates/healthEstimate.hbs'
	]

	return loadTemplates(templatePaths)
}
