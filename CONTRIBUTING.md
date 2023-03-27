# Contributing to Health Estimate

-   [Contributing to Health Estimate](#contributing-to-health-estimate)
    -   [Adding Support to a System](#adding-support-to-a-system)
        -   [Example File](#example-file)

## Adding Support to a System

Get the system's id (`game.system.id`), go to the [module/systems](module/systems) folder, and create a JS file with the system's id as the name. E.g. `dnd5e.js`.

### Example File

<details>
	<summary>Here's an example file:</summary>

```js
//These are shorthand functions that call game.i18n.format and game.i18n.localize. They're hardcoded to Health Estimate's localization keys.
import { f, t } from "../utils.js";

// The fraction calculating function. This is the only required function in the file.
const fraction = function (token) {
    const actor = token.actor;
    let temp = 0;
    if (token.actor.type === "character" && game.settings.get("healthEstimate", "core.addTemp")) {
      temp = hp.temp;
    }
    return Math.min((temp + hp.value) / hp.max, 1);
};

// Additional settings for the Health Estimate module.
// First two are generic settings used on some systems.
const settings = () => {
	return {
    "core.addTemp": { // Add Temporary HP to the calculation. Used in the fraction function above.
			type: Boolean,
			default: false,
		},
		"core.breakOnZeroMaxHP": { // Don't render for tokens with 0 maximum hp. Used in the breakCondition below.
			type: Boolean,
			default: true,
		},
		"systemname.setting": {
			// Name and Hint are unnecessary if they are set as "systemname.setting.name" and "systemname.setting.hint".
			// Scope is unnecessary if "world"
			// Config is unnecessary if true
			type: Boolean, //Type is required
			default: false, //Default is required
		},
}

// Special logic in case additional data should be taken into account to estimate a token's health. E.g. a non-living type of token, like a vehicle.
const descriptions = function (descriptions, stage, token, state = { dead: false, desc: "" }, fraction) {
	if (state.dead) {
		return state.desc;
	}
	const type = token.actor.type;
	if (type === "vehicle") {
		descriptions = game.settings.get("healthEstimate", "systemname.setting").split(/[,;]\s*/); //This assumes a setting set as a string, similar to Stages settings.
		stage = Math.max(0, Math.ceil((descriptions.length - 1) * fraction));
	}
	return descriptions[stage];
};

// A set of conditionals that will stop the estimate from being rendered.
const breakCondition = `
	|| token.actor.type === 'loot'
  || (game.settings.get('healthEstimate', 'core.breakOnZeroMaxHP') && token.actor.system.hp.max === 0)
`;

// This is for the big marker shown on defeated tokens (the skull marker by default).
// Only use this if your system doesn't add the marker as an effect.
const tokenEffects = function (token) {
	return token.document.overlayEffect === game.healthEstimate.deathMarker;
};

// Most system files are formatted to export all the constants at the end of file. Be sure to change it as you change the file.
export { fraction, settings, descriptions, breakCondition, tokenEffects };
```

</details>
