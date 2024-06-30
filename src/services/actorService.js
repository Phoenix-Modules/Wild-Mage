import {actorFlags, moduleName} from "../constants/moduleData";

export function getActorWildIntensity(actor) {
    if(!actor) {
        console.error("Actor not defined!");
        return;
    }
    return actor.getFlag(moduleName, actorFlags.WildSurgeIntensity);
}

export async function setActorWildIntensity(actor, value) {
    if(!actor) {
        console.error("Actor not defined!");
        return;
    }
    await actor.setFlag(moduleName, actorFlags.WildSurgeIntensity, value);
}