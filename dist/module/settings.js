export const registerSettings = function() {
    function t(key) {
        return game.i18n.localize(`healthEstimate.${key}`);
    }
    game.settings.register("healthEstimate", "stateNames", {
        name:     t("stateNames.name"),
        hint:     t("stateNames.hint"),
        scope:    "world",
        type:     Array,
        default:  t("stateNames.default"),
        config:   true,
        onChange: s => HealthEstimate.config.stateNames = s
    });
    game.settings.register("healthEstimate", "deathState", {
        name:     t("deathState.name"),
        hint:     t("deathState.hint"),
        scope:    "world",
        type:     Boolean,
        default:  true,
        config:   true,
        onChange: s => HealthEstimate.config.deathState = s
    });
    game.settings.register("healthEstimate", "deathStateName", {
        name:     t("deathStateName.name"),
        hint:     t("deathStateName.hint"),
        scope:    "world",
        type:     String,
        default:  t("deathStateName.default"),
        config:   true,
        onChange: s => HealthEstimate.config.deathStateName = s
    });
    game.settings.register("healthEstimate", "color", {
        name:     t("color.name"),
        hint:     t("color.hint"),
        scope:    "world",
        type:     Boolean,
        default:  true,
        config:   true,
        onChange: s => HealthEstimate.config.color = s
    });
    // game.settings.register("healthEstimate", "colorArray", {
    // 	name:     t("colorArray.name"),
    // 	hint:     t("colorArray.hint"),
    // 	scope:    "world",
    // 	type:     Array,
    // 	default:  ["rgb(255 0 0)", "rgb(0 255 0)"],
    // 	config:   true,
    // 	onChange: s => {}
    // })
    game.settings.register("healthEstimate", "smoothGradient", {
        name:     t("smoothGradient.name"),
        hint:     t("smoothGradient.hint"),
        scope:    "world",
        type:     Boolean,
        default:  true,
        config:   true,
        onChange: s => HealthEstimate.config.smoothGradient = s
    })
}
