import { ChatMessageService, PhxConst, ActorService, CompendiumService, RollTableService } from '@phoenix-modules/common-library';
import {CLASS_FEATURES, MODULE_DATA, MODULE_NAME, ROLL_TABLES} from "../constants/moduleData";
import {getBaseThreshold, getDetailedResults, getThresholdScale} from "./settingsService";
import {getActorWildIntensity, setActorWildIntensity} from "./actorService";
import {executeWildEffect} from "./wildEffectService";
import {createGmMessage, createPlayerMessage} from "./chatMessageHandler";

export async function processWildMagic(chatMessage, messageText, chatData) {
    await processWildSurge(chatMessage);
    //Todo: Check for Bend Luck
    //Todo: Check for specific Item usage
    //Todo: Check for Spell bombardment
    //Todo: For Tides of Chaos
    //Todo: Check for Controlled Chaos
}

export async function checkBendLuck(chatMessage, messageText, chatData) {
    // const targets = await Services.getTargetsFromChatMessage(chatMessage);
    // console.log(targets);
}

async function processWildSurge(chatMessage) {
    const messageItem = await ChatMessageService.GetChatMessageSpeakerItem(chatMessage);
    if(messageItem === undefined) return;
    //Check if the item used is a spell, if not, we're done here.
    if(messageItem.type !== PhxConst.ITEM_TYPE.Spell) return;
    
    //Is the spell level > 0?
    if(isNaN(messageItem.system.level) || messageItem.system.level === 0) return;
    
    //Check to see if the caster has the wild surge feat, if not, return
    const actor = await ChatMessageService.GetChatMessageSpeakerActor(chatMessage);
    if(!await actorHasWildSurgeFeat(actor)) return;
    
    const actorToken = await ChatMessageService.GetChatMessageSpeakerToken(chatMessage);
    if(!actorToken) {
        console.error("Speaker does not have a token on the canvas!");
        return;
    }

    const targets = ChatMessageService.GetChatMessageSpeakerTargets(chatMessage);
    
    //rotate the token to face the target.
    await window.PhoenixSocketLib[MODULE_NAME].executeAsGM(PhxConst.SOCKET_METHOD_NAMES.ROTATE_TOWARDS_TARGET, actorToken, targets[0]);
    
    //Check if we triggered a wild surge
    const triggerResult = await hasWildSurgeTriggered(actor);
    if(!triggerResult) return;
    
    await doWildSurge(actor, actorToken, messageItem, targets);
}

//Checks if actor has the wild surge
async function actorHasWildSurgeFeat(actor) {
    const actorItems = await ActorService.GetItemsFromActorByType(actor, PhxConst.ITEM_TYPE.Feat);
    let hasWildMagic = false;
    if(Array.isArray(actorItems)) {
        actorItems.forEach(x => {
            if(x.name === CLASS_FEATURES.WildMagicSurge) {
                hasWildMagic = true;
            }
        });
    }
    return hasWildMagic;
}

//Checks if wild surge triggered
async function hasWildSurgeTriggered(actor) {
    
    //Roll for surge trigger
    const surgeTriggerRoll = new Roll("1d20"); 
    const surgeTriggerRollValue = await surgeTriggerRoll.roll();
    
    //Get the wild threshold set in settings
    const baseThreshold = getBaseThreshold(); 
    //If we're not scaling, set to 0, otherwise get the intensity from the actor, if it hasn't been set, default to 0  
    const intensity = getThresholdScale() ? (getActorWildIntensity(actor) || 0) : 0; 
    
    //If our roll is below the threshold plus intensity, update intensity(if scaling) and return true 
    if(surgeTriggerRollValue.total < (baseThreshold + intensity)) {
        if(getThresholdScale()) { //If we're scaling, update the actor intensity
            await setActorWildIntensity(actor, intensity + 1)
        }
        return true;        
    }  
    return false;
}

//Perform a wild surge!
async function doWildSurge(actor, actorToken, spell, targets) {
    
    const compFindResult = await CompendiumService.FindInCompendiums(ROLL_TABLES.WildSurgeToM, PhxConst.COMP_TYPES.RollTable, MODULE_DATA.rollTablePack);
    const compRollTable = compFindResult[0];
    
    const result = RollTableService.RollWithoutFoundry(compRollTable);
    
    console.log(result);
    
    //await executeWildEffect(actor, actorToken, spell, targets, result.range[0]);
    
    if(!getDetailedResults()) {
        createGmMessage(actor, result.range[0], result.text);
    }
    
    createPlayerMessage(actor, result.range[0], result.text, result.text);
}