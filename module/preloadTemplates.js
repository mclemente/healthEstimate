export const preloadTemplates = async function () {
	const templatePaths = [
		// Add paths to "modules/healthEstimate2/templates"
		'modules/healthEstimate2/templates/healthEstimate.hbs'
	]

	return loadTemplates(templatePaths)
}
