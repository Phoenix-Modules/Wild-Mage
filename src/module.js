import { parseChatForFlight } from './services/flightService.js';
import { addFlightFeaturesToCompendium } from "./services/dataService.js";
import {registerSettings} from "./services/settingsService";
import Features from "./constants/features";
Hooks.once("init", async () => {
    await registerSettings();
    console.log("Phoenix Modules - Wild Mage is installed!");
});


Hooks.once('ready', async () => {
    await addFeaturesToCompendium();
});


Hooks.on("preCreateChatMessage", (chatMessage, messageText, chatData) => {
    parseChatForFlight(chatMessage, messageText, chatData);
    const itemNamesToBlock = [Features.RaiseLabel, Features.LowerLabel];
    const item = itemNamesToBlock.find(item => chatMessage.content.includes(item));
    if (item) {
        return false;
    }
});