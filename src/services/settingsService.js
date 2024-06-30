import { moduleName} from "../constants/moduleData";
import settings from "../constants/settings";

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
    
    game.settings.register(moduleName, settings.scaleThreshold, {
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
    game.settings.register(moduleName, settings.baseThreshold, {
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
}

export function getThresholdScale() {
    return game.settings.get(moduleName, settings.scaleThreshold);
}

export function getBaseThreshold() {
    return game.settings.get(moduleName, settings.baseThreshold);
}
