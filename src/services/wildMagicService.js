import { Services, Constants } from '@phoenix-modules/common-library';
import {classFeatures, moduleData, rollTableNames} from "../constants/moduleData";
import {getBaseThreshold, getThresholdScale} from "./settingsService";
import {getActorWildIntensity, setActorWildIntensity} from "./actorService";

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
    const messageItem = await Services.getItemFromChatMessage(chatMessage);
    if(messageItem === undefined) return;
    //Check if the item used is a spell, if not, we're done here.
    if(messageItem.type !== Constants.ITEM_TYPE.Spell) return;
    
    //Is the spell level > 0?
    if(isNaN(messageItem.system.level) || messageItem.system.level === 0) return;
    
    //Check to see if the caster has the wild surge feat, if not, return
    const actor = await Services.getActorFromChatMessage(chatMessage);
    if(!await actorHasWildSurgeFeat(actor)) return;
    
    //Check if we triggered a wild surge
    const triggerResult = await hasWildSurgeTriggered(actor);
    if(!triggerResult) return;
    
    await doWildSurge(actor, messageItem);
}

//Checks if actor has the wild surge
async function actorHasWildSurgeFeat(actor) {
    const actorItems = await Services.getItemsFromActorByType(actor, Constants.ITEM_TYPE.Feat);
    let hasWildMagic = false;
    if(Array.isArray(actorItems)) {
        actorItems.forEach(x => {
            if(x.name === classFeatures.WildMagicSurge) {
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
async function doWildSurge(actor, spell, target) {
    // Roll on the wild magic table
    const surgeRoll = new Roll("1d100");
    const surgeRollValue = await surgeRoll.roll();
    const surgeIndex = surgeRollValue.total - 1; // Adjusting for zero-based index
    
    
    
    // const rollTableArray = await Services.findInCompendiums(rollTableNames.WildSurgeToM, Constants.COMPENDIUM_TYPES.RollTable, moduleData.rollTablePack);
    // const rollTable = rollTableArray[0];
    // const surgeResult = rollTable.collections.results[surgeIndex];
    // console.log(surgeResult);
    ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `<h2>Wild Magic Surge</h2><p>Roll: ${surgeIndex}</p>`
    });
}