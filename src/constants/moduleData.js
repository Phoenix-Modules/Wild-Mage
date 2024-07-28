
export const MODULE_NAME = "phoenix-modules-wild-mage";

export const MODULE_DATA = {
    moduleFolder: `/modules/${MODULE_NAME}`,
    imagesFolder: `/modules/${MODULE_NAME}/assets/images`,
    soundsFolder: `/modules/${MODULE_NAME}/assets/sounds`,
    classPack: "pm-classes",
    featurePack: "pm-class-features",
    rollTablePack: "pm-rolltables"
}

export const MODULE_SETTINGS = {
    scaleThreshold: "scaleThreshold",
    baseThreshold: "baseThreshold",
    showHelp: "showHelp",
    isDebug: "isWildDebug",
    detailedResults: "isDetailedResults"
}

export const CLASS_FEATURES = {
    WildMagicSurge: "Wild Magic Surge",
    BendLuck: "Bend Luck",
    ControlledChaos: "Controlled Chaos",
    SpellBombardment: "Spell Bombardment",
    TidesOfChaos: "Tides of Chaos",
    WildItemControl: "Wild Item Control"    
}

export const SOUNDS = {
    WallOfForce: `${MODULE_DATA.soundsFolder}/WallOfForce.mp3`,
    Landing: `${MODULE_DATA.soundsFolder}/Winged Landing.mp3`,
}

export const CLASSES = {
    WildMage: "Wild Mage",
    WildSorcerer: "Wild Sorcerer"
}

export const ROLL_TABLES = {
    WildSurgeToM: "Wild Surge: Wild Magic (Tome of Magic)",
    //TODO: Add 5e version with option to switch
}

export const ITEM_CONTROL = {
    AmuletOfPlanes: "Amulet of the Planes",
    WandOfWonder: "Wand of Wonder",
    BagOfBeans: "Bag of Beans",
    BagOfTricks: "Bag of Tricks",
    DeckOfIllusions: "Deck of Illusions",
    DeckOfManyThings: "Deck of Many Things",
    WellOfManyWorlds: "Well of Many Worlds"
}

export const ACTOR_FLAGS = {
    WildSurgeIntensity: "wild-surge-intensity",
    //Todo: add flags for other features
}

export const IMAGES = {
    ModuleBanner: `${MODULE_DATA.imagesFolder}/Module Banner.png`
}
