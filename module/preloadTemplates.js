export const preloadTemplates = async function () {
	const templatePaths = [
		// Add paths to "modules/healthEstimate/templates"
		'modules/healthEstimate/templates/healthEstimate.hbs'
	]

	return loadTemplates(templatePaths)
}
