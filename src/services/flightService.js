import {
    getActorFromChatMessage,
    getCurrentSceneTokenFromChatMessage,
    getItemFromChatMessage
} from "./chatMessageService";
import {addEffectIfMissing, deleteEffectIfExists, hasEffect} from "./actorService";
import {getAcAdjustmentValue, getIncrementValue, getMaxFlightHeightValue, getTokenScaleValue} from "./settingsService";
import Features from "../constants/features";
import {scaleToken} from "./tokenService";
import {animateFlying, animateLanding} from "./animationService";

const flightItems = ["Take Flight", "Land", "Fly Higher", "Fly Lower"];

export async function parseChatForFlight(chatMessage, messageText, chatData) {
    const itemUsed = await getItemFromChatMessage(chatMessage);
    if(!itemUsed) return;
    
    const command = flightItems.find(flightItem => itemUsed.name === flightItem);
    if(!command) return;
       
    const initiatingActorToken = await getCurrentSceneTokenFromChatMessage(chatMessage);
    const controlledToken = canvas.tokens.controlled[0];
    
    if(game.user.isGM) {
        if(!controlledToken) {
            ui.notifications.warn("Please select a token to initiate flight on.");
        }
        await handleFlightCommand(command, controlledToken.actor, controlledToken);
        return;
    }
    

    if(initiatingActorToken.actorId !== controlledToken.document.actorid) {
        ui.notifications.warn("Please select your token to use this action.");
        return;
    }
    
    await handleFlightCommand(command, controlledToken.actor, controlledToken);    
}

async function updateTokenElevation(token, elevation) {    
    if(token.document.elevation === elevation) return;
    await token.document.update({ elevation: elevation });
}

async function updateFlyingStatus(actor, token, status) {
    const acAdjustment = getAcAdjustmentValue();
    const isJb2a = game.modules.get('jb2a_patreon')?.active;
    const isSequencer = game.modules.get('sequencer')?.active;
    
    const effectData = {
        label: "Flying",
        icon: Features.FlyingImage,
        changes: [
            { key: "system.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: acAdjustment }
        ],
        statuses: [
            "flying"
        ],
        origin: actor.uuid,
    };
    

    if (status) {
        if(isJb2a && isSequencer) {
            animateFlying(token);
        }
        await addEffectIfMissing(actor, effectData);
    } else {
        if(isJb2a && isSequencer) {
            animateLanding(token);
        }
        await deleteEffectIfExists(actor, effectData.label);
    }
}

async function handleFlightCommand(command, actor, token) {
    const incrementValue = getIncrementValue();
    const maxHeight = getMaxFlightHeightValue();
    const shouldScaleToken = getTokenScaleValue();
    const currentElevation = token.document.elevation;
        
    let updateFlightStatus = false;
    let flightStatus;
    let newElevation;
    
    switch (command) {
        case "Take Flight":
            updateFlightStatus = true;
            flightStatus = true;
            newElevation = incrementValue;
            break;
        case "Land":
            if(!await hasEffect(actor, "Flying")) return;
            updateFlightStatus = true;
            flightStatus = false;
            newElevation = 0;            
            break;
        case "Fly Higher":
            if(!await hasEffect(actor, "Flying")) return;
            updateFlightStatus = false;
            newElevation = Math.min((currentElevation || 0) + incrementValue, maxHeight);            
            break;
        case "Fly Lower":
            if(!await hasEffect(actor, "Flying")) return;
            updateFlightStatus = false;
            newElevation = Math.max((currentElevation || 0) - incrementValue, incrementValue);
            break;
        default:
            console.warn(`Unknown flight command: ${command}`);
    }

    if(updateFlightStatus) {
        await updateFlyingStatus(actor, token, flightStatus);        
    }
    if(shouldScaleToken) {
        await scaleToken(token, newElevation);
    }
    await updateTokenElevation(token, newElevation);
}