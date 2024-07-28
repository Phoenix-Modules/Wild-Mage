import {ACTOR_FLAGS, MODULE_NAME} from "../constants/moduleData";

export function getActorWildIntensity(actor) {
    if(!actor) {
        console.error("Actor not defined!");
        return;
    }
    return actor.getFlag(MODULE_NAME, ACTOR_FLAGS.WildSurgeIntensity);
}

export async function setActorWildIntensity(actor, value) {
    if(!actor) {
        console.error("Actor not defined!");
        return;
    }
    await actor.setFlag(MODULE_NAME, ACTOR_FLAGS.WildSurgeIntensity, value);
}