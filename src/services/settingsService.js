import {moduleData} from "../constants/moduleData";
import Settings from "../constants/settings";
import Features from "../constants/features";

export async function registerSettings() {
    game.settings.register(moduleData.moduleName, Settings.FlightHeightKey, {
        name: 'Max Flight Height',
        hint: 'The maximum height (in feet) that a character can fly.',
        scope: 'world', 
        config: true, 
        type: Number, 
        default: 100, 
        restricted: true, 
        onChange: value => {
            console.log(`Max flight height set to ${value}`);
        }
    });

    game.settings.register(moduleData.moduleName, Settings.IncrementKey, {
        name: 'Raise/Lower Increment',
        hint: `The increment (in feet) that a character moves when using the ${Features.RaiseLabel}/${Features.LowerLabel} feature.`,
        scope: 'world',
        config: true,
        type: Number,
        default: 5,
        restricted: true,
        onChange: value => {
            console.log(`Height increment set to ${value}`);
        }
    });

    game.settings.register(moduleData.moduleName, Settings.AcAdjustmentKey, {
        name: 'Adjust AC when flying',
        hint: 'How much AC (positive or negative) to adjust when in flying state',
        scope: 'world',
        config: true,
        type: Number,
        default: -5,
        restricted: true,
        onChange: value => {
            console.log(`AC adjustment set to ${value}`);
        }
    });

    game.settings.register(moduleData.moduleName, Settings.TokenScaleKey, {
        name: 'Scale Token with Height',
        hint: 'Scale the token bigger or smaller depending on height',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
        restricted: true,
        onChange: value => {
            console.log(`AC adjustment set to ${value}`);
        }
    });
}


export function getMaxFlightHeightValue() {
    return game.settings.get(moduleData.moduleName, Settings.FlightHeightKey);
}


export function getIncrementValue() {
    return game.settings.get(moduleData.moduleName, Settings.IncrementKey);
}

export function getAcAdjustmentValue() {
    return game.settings.get(moduleData.moduleName, Settings.AcAdjustmentKey);
}

export function getTokenScaleValue() {
    return game.settings.get(moduleData.moduleName, Settings.TokenScaleKey);
}