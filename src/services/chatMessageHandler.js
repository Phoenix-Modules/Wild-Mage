import {getDetailedResults} from "./settingsService";

export function createPlayerMessage(actor, range, text, detailText) {
    ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: getPlayerMessageContent(range, detailText, text)
    });
}

export function createGmMessage(actor, range, detailText) {
    const gmUsers = game.users.filter(user => user.isGM);
    const gmUserIds = gmUsers.map(user => user.id);
    
    ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: getGMMessageContent(range, detailText),
        whisper: gmUserIds
    });
}

function getPlayerMessageContent(value, detailText, text) {
    const contentText = getDetailedResults() ? detailText : text;
    return getMessageContent(value, contentText);
}

function getGMMessageContent(value, detailText) {
    return getMessageContent(value, detailText);
}

function getMessageContent(value, text) {
    const title = '<div class="wild-surge-text-bg wild-surge-title">Wild Surge Roll</div>';
    const rollValue = `<div class="wild-surge-text-bg wild-surge-roll">*${value}*</div>`;
    const content = `<div class="wild-surge-text-bg wild-surge-detail">${text}</div>`
    return `<div class="wild-surge-chat-bg">${title}${rollValue}${content}</div>`;
}
