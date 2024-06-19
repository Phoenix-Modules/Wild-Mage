import {registerSettings} from "./services/settingsService";
import {generateCompendiumItems} from "./services/generationService";
Hooks.once("init", async () => {
    await registerSettings();
    console.log("Phoenix Modules - Wild Mage is installed!");
});


Hooks.once('ready', async () => {
    await generateCompendiumItems();
});


Hooks.on("preCreateChatMessage", (chatMessage, messageText, chatData) => {
});