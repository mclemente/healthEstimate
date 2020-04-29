export const registerSettings = function() {
    function t(key) {
        return game.i18n.localize(`healthEstimate.${key}`);
    }
    game.settings.register("healthEstimate", "stateNames", {
        name:     t("stateNames.name"),
        hint:     t("stateNames.hint"),
        scope:    "world",
        type:     String,
        default:  t("stateNames.default").join(", "),
        config:   true
    });
    game.settings.register("healthEstimate", "deathState", {
        name:     t("deathState.name"),
        hint:     t("deathState.hint"),
        scope:    "world",
        type:     Boolean,
        default:  true,
        config:   true
    });
    game.settings.register("healthEstimate", "deathStateName", {
        name:     t("deathStateName.name"),
        hint:     t("deathStateName.hint"),
        scope:    "world",
        type:     String,
        default:  t("deathStateName.default"),
        config:   true
    });
    game.settings.register("healthEstimate", "deathMarker", {
        name:     t("deathMarker.name"),
        hint:     t("deathMarker.hint"),
        scope:    "world",
        type:     String,
        default:  "icons/svg/skull.svg",
        config:   true
    });
    if (["starfinder","pf1","pf2e","archmage","dnd5e"].includes(game.system.id)){
        game.settings.register("healthEstimate", "addTemp", {
            name:    t("addTemp.name"),
            hint:    t("addTemp.hint"),
            scope:   "world",
            type:    Boolean,
            default: false,
            config:  true
        })
    }
    if (game.system.id === "numenera") {
        game.settings.register("healthEstimate", "countPools", {
            name:    t("countPools.name"),
            hint:    t("countPools.hint"),
            scope:   "world",
            type:    Boolean,
            default: false,
            config:  true
        })
    }
    if (game.system.id === "starfinder") {
        game.settings.register("healthEstimate", "addStamina", {
            name:    t("addStamina.name"),
            hint:    t("countPools.hint"),
            scope:   "world",
            type:    Boolean,
            default: true,
            config:  true
        });
        game.settings.register("healthEstimate", "useThreshold", {
            name:    t("useThreshold.name"),
            hint:    t("useThreshold.hint"),
            scope:   "world",
            type:    Boolean,
            default: false,
            config:  true
        });
        game.settings.register("healthEstimate", "thresholdNames", {
            name:    t("thresholdNames.name"),
            hint:    t("thresholdNames.hint"),
            scope:   "world",
            type:    String,
            default: t("thresholdNames.default").join(", "),
            config: true
        });
        game.settings.register("healthEstimate", "vehicleNames", {
            name:    t("vehicleNames.name"),
            hint:    t("vehicleNames.hint"),
            scope:   "world",
            type:    String,
            default: t("vehicleNames.default").join(", "),
            config: true
        })
    }
    if (game.system.id === "worldbuilding") {
        game.settings.register("healthEstimate", "simpleRule", {
            name: t("simpleRule.name"),
            hint: t("simpleRule.hint"),
            scope: "world",
            type: String,
            default: t("simpleRule.default"),
            config: true
        });
    }
    game.settings.register("healthEstimate", "fontSize", {
        name:    t("fontSize.name"),
        hint:    t("fontSize.hint"),
        scope:   "client",
        type:    String,
        default: "x-large",
        config:   true
    });
    game.settings.register("healthEstimate", "color", {
        name:     t("color.name"),
        hint:     t("color.hint"),
        scope:    "world",
        type:     Boolean,
        default:  true,
        config:   true
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
        config:   true
    })
};
