export const registerSettings = function() {
	const isNotPF2 = !(game.system.id === "pf2e");
    
    function t(key) {
        return game.i18n.localize(`healthEstimate.${key}`);
    }
    function addSetting(key, data, scope = "world", config = true){
        const commonData = {
            name:   t(`${key}.name`),
            hint:   t(`${key}.hint`),
	        scope:  scope,
            config: config
        };
        game.settings.register("healthEstimate", key, Object.assign(commonData,data))
    }
    
    addSetting("stateNames", {
        type:     String,
        default:  t("stateNames.default").join(", "),
    });
    addSetting("deathState", {
        type: Boolean,
        default: isNotPF2,
    }, "world", isNotPF2);
    addSetting("deathStateName", {
        type: String,
        default: t("deathStateName.default"),
    }, "world", isNotPF2);
    addSetting("deathMarker", {
        type: String,
        default: "icons/svg/skull.svg",
    }, "world", isNotPF2);
    if (["starfinder","pf1","pf2e","archmage","dnd5e"].includes(game.system.id)){
        addSetting("addTemp", {
            type:    Boolean,
            default: false,
        })
    }
    if (game.system.id === "pf1") {
        addSetting("PF1.showExtra", {
            type:    Boolean,
            default: true,
        });
        addSetting("PF1.disabledName", {
            type:    String,
            default: t("PF1.disabledName.default")
        });
        addSetting("PF1.dyingName", {
            type:    String,
            default: t("PF1.dyingName.default")
        })
    }
    if (game.system.id === "numenera") {
        addSetting("countPools", {
            type:    Boolean,
            default: false,
        })
    }
    if (game.system.id === "starfinder") {
        addSetting("addStamina", {
            type:    Boolean,
            default: true,
        });
        addSetting("useThreshold", {
            type:    Boolean,
            default: false,
        });
        addSetting("thresholdNames", {
            type:    String,
            default: t("thresholdNames.default").join(", "),
        });
        addSetting("vehicleNames", {
            type:    String,
            default: t("vehicleNames.default").join(", "),
        })
    }
    if (game.system.id === "worldbuilding") {
        addSetting("simpleRule", {
            type: String,
            default: t("simpleRule.default"),
        });
    }
    addSetting("fontSize", {
        type:    String,
        default: "x-large",
    }, "client");
    addSetting("color", {
        type:     Boolean,
        default:  true,
    });
    // addSetting("colorArray", {
    // 	type:     Array,
    // 	default:  ["rgb(255 0 0)", "rgb(0 255 0)"],
    // 	onChange: s => {}
    // })
    addSetting("smoothGradient", {
        type:     Boolean,
        default:  true,
    })
};
