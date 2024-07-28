import {registerSettings} from "./services/settingsService";
import {processWildMagic} from "./services/wildMagicService";
import {MODULE_NAME} from "./constants/moduleData";
import {SocketService} from "@phoenix-modules/common-library";

Hooks.once("init", async () => {
    await registerSettings();
    console.log("Phoenix Modules - Wild Mage is installed!");
});

Hooks.once("ready", () => {
    new SocketService(MODULE_NAME);
});

Hooks.on("preCreateChatMessage", async (chatMessage, content, metaData) => {    
    await processWildMagic(chatMessage, content, metaData);
});

Hooks.on("createChatMessage", async (chatMessage, messageText, chatData) => {
});