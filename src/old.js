
//Wild Mage
Hooks.on("preUpdateActor", async (actor, data, options, userId) => {
    if (!actor || !data || !data.items) return;

    const wildMageClass = actor.items.find(i => i.type === "class" && i.name === "Wild Mage");
    if (!wildMageClass) return;

    const spellCast = data.items.find(i => i.type === "spell" && i.data.prepared === true);
    if (!spellCast) return;

    const spellLevel = spellCast.data.level;

    // Roll for a wild magic surge when a spell is cast
    if (spellLevel > 0) {
        const roll = new Roll("1d20").roll();
        if (roll.total <= wildMagicThreshold>) {
            // Roll on the wild magic table
            const surgeRoll = new Roll("1d100").roll();
            const surgeIndex = surgeRoll.total - 1; // Adjusting for zero-based index

            // Determine the original target or location of the spell
            let target;
            if (options.target) {
                target = options.target;
            } else if (options.template) {
                target = options.template;
            } else {
                target = spellCast.data.target; // Fallback to the spell's own target definition
            }

            // Log the original spell and its target/location
            console.log(`Original Spell: ${spellCast.name}`);
            console.log(`Target/Location: ${target}`);

            // Execute the corresponding wild magic effect
            if (surgeIndex < wildMagicEffects.length) {
                wildMagicEffects[surgeIndex](actor, spellCast, target);
            }

            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: `<h2>Wild Magic Surge</h2><p>Roll: ${surgeRoll.total}</p><p>Effect: ${surgeIndex < wildMagicEffects1.length ? wildMagicEffects1[surgeIndex].toString() : surgeIndex < wildMagicEffects1.length + wildMagicEffects2.length ? wildMagicEffects2[surgeIndex - wildMagicEffects1.length].toString() : surgeIndex < wildMagicEffects1.length + wildMagicEffects2.length + wildMagicEffects3.length ? wildMagicEffects3[surgeIndex - wildMagicEffects1.length - wildMagicEffects2.length].toString() : surgeIndex < wildMagicEffects1.length + wildMagicEffects2.length + wildMagicEffects3.length + wildMagicEffects4.length ? wildMagicEffects4[surgeIndex - wildMagicEffects1.length - wildMagicEffects2.length - wildMagicEffects3.length].toString() : wildMagicEffects5[surgeIndex - wildMagicEffects1.length - wildMagicEffects2.length - wildMagicEffects3.length - wildMagicEffects4.length].toString()}</p>`
            });
        }
    }
});