import {MODULE_NAME, MODULE_SETTINGS} from "../constants/moduleData";

export async function registerSettings() {
    // Register a custom button setting
    // game.settings.registerMenu(moduleName, settings.showHelp, {
    //     name: "Show Help",
    //     label: "Show Help",
    //     hint: "Click to view the help documentation.",
    //     icon: "fas fa-question-circle",
    //     type: HelpDialog,
    //     restricted: false
    // });
    
    game.settings.register(MODULE_NAME, MODULE_SETTINGS.detailedResults, {
        name: "Display Detailed Results To Players",
        hint: "If enabled, the results of a surge roll are displayed to players, otherwise GM only",
        scope: "world",
        config: true,
        type: Boolean,
        restricted: true,
        onChange: value => {
            console.log(`Detailed results to players is set to: ${value}`);
        },
        default: false
    })
    
    game.settings.register(MODULE_NAME, MODULE_SETTINGS.scaleThreshold, {
        name: "Scale Threshold on surge fail",
        hint: "If enabled, the likelihood of wild magic surges will be scaled.",
        scope: "world",
        config: true,
        type: Boolean,
        restricted: true,
        onChange: value => {
            console.log(`Wild Magic Threshold Scaling set to: ${value}`);
        },
        default: false
    });

    // Register a numeric setting
    game.settings.register(MODULE_NAME, MODULE_SETTINGS.baseThreshold, {
        name: "Base Wild Magic Threshold",
        hint: "Set the base threshold for wild magic surges. (default: 1)",
        scope: "world",
        config: true,
        type: Number,
        restricted: true,
        onChange: value => {
            console.log(`Base threshold set to: ${value}`);
        },
        default: 1
    });

    game.settings.register(MODULE_NAME, MODULE_SETTINGS.isDebug, {
        name: "Turn Wild Effect Debug On",
        hint: "Prompts for wild effect index, 0 based",
        scope: "world",
        config: true,
        type: Boolean,
        restricted: true,
        onChange: value => {
            console.log(`Wild Magic Threshold Scaling set to: ${value}`);
        },
        default: false
    });
}

export function getDetailedResults() {
    return game.settings.get(MODULE_NAME, MODULE_SETTINGS.detailedResults);
}

export function getThresholdScale() {
    return game.settings.get(MODULE_NAME, MODULE_SETTINGS.scaleThreshold);
}

export function getBaseThreshold() {
    return game.settings.get(MODULE_NAME, MODULE_SETTINGS.baseThreshold);
}

export function getWildDebug() {
    return game.settings.get(MODULE_NAME, MODULE_SETTINGS.isDebug);
}
