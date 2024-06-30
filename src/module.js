import {registerSettings} from "./services/settingsService";
import {checkBendLuck, processWildMagic} from "./services/wildMagicService";

Hooks.once("init", async () => {
    await registerSettings();
    console.log("Phoenix Modules - Wild Mage is installed!");
});

Hooks.on("preCreateChatMessage", async (chatMessage, messageText, chatData) => {
});

Hooks.on("createChatMessage", async (chatMessage, messageText, chatData) => {
    await processWildMagic(chatMessage, messageText, chatData);
});