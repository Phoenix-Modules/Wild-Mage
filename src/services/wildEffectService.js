import {WildEffectFunctions} from "../wildmagic/wildEffectFunctions";
import {getWildDebug} from "./settingsService";

export async function executeWildEffect(actor, actorToken, spell, target, index){
    if (getWildDebug()) {
        const newIndex = await promptWildEffectIndex(index, wildMagicEffects.length - 1);
        if (newIndex !== null) {
            index = newIndex;
        }
    }
    const wildEffect = wildMagicEffects[index];
    await wildEffect(actor, actorToken, spell, target);
}


async function promptWildEffectIndex(currentIndex, maxIndex) {
    return new Promise((resolve) => {
        new Dialog({
            title: "Override Wild Effect Index",
            content: `<label for="wild-effect-index">Index:</label>
                      <input id="wild-effect-index" name="wild-effect-index" type="number" value="${currentIndex}" min="0" max="${maxIndex}" style="width: 100%;">`,
            buttons: {
                ok: {
                    label: "Override",
                    callback: (html) => {
                        const newIndex = parseInt(html.find('[name="wild-effect-index"]').val());
                        resolve(newIndex);
                    }
                },
                cancel: {
                    label: "Cancel",
                    callback: () => {
                        resolve(null);
                    }
                }
            },
            default: "ok",
            close: () => {
                resolve(null);
            }
        }).render(true);
    });
}


const wildMagicEffects = [
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.wallOfForce(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.skunkSmell(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.nonPoisonousSnakes(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.itchyClothesCaster(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.lightOnCaster(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.centerOnCasterSixty(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.centerOnCasterSixty(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.nextPhraseTrue(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.casterHairLength(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.casterPivot180(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.blackenedFace(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.allergicToItems(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.enlargedHead(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.reduceCasterSize(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.casterLoveTarget(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.cannotCancel(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.casterRandomPolymorph(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.bubblesNoWords(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.reversedTongues(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.wallOfFire(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.enlargeFeet(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.duplicateSpellOnCaster(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.levitateCaster(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.fearOnCaster(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.squeakyVoice(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.xRayVision(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.ageTenYears(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.silenceOnCaster(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.pitCaster(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.reverseGravity(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.streamers(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.reboundSpell(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.casterInvisible(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.colorSpray(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.butterflies(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.monsterFootprints(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.gemSpray(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.music(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.createFoodAndWater(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.extinguishLights(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.deMagicItem(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.magicAnItem(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.invisibleAnItem(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.smokeyEars(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.dancingLights(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.hiccup(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.knock(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.swapWithTarget(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.newRandomTarget(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.preventSpell(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.elementalSummon(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.weatherChange(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.bangStun(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.voiceExchange(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.gateSummon(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.shriek(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.reduceByHalf(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.reverseAll(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.spellToElemental(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.weaponGlow(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.removeSavingThrow(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.delayCast(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.glowMagic(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.personalitySwap(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.targetSizeReduce(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.addLightningBolt(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.enlargeTarget(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.darkness(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.plantGrowth(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.destroyMatter(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.castFireball(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.targetPetrified(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.preventSpellSlotConsumption(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.healTenFeet(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.dizzy(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.wallOfFireTarget(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.levitateTarget(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.darknessOnTarget(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.targetIsCharmed(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.consumeTargetSpellSlots(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.enlargeTargetFeet(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.rustMonster(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.polymorphTarget(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.targetLovesCaster(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.targetSexChange(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.targetRainCloud(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.targetStinkingCloud(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.targetHeavyObject(actor, actorToken, spellCast, target);
    },
    async (actor, actorToken, spellCast, target) => {
        await WildEffectFunctions.targetHeavyObject(actor, actorToken, spellCast, target);
    },
    (actor) => {
        // Target begins sneezing. No spells can be cast for 1d6 rounds
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor}),
            content: "Wild Magic Surge: Target begins sneezing. No spells can be cast for 1d6 rounds."
        });
        // Add effect to target preventing spellcasting with 1d6 rounds duration.
    },
    (actor) => {
        // Spell effect has 60' radius centered on target
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor}),
            content: "Wild Magic Surge: Spell effect has 60' radius centered on target."
        });
        // If original spell has a radius, adjust it to 60 feet centered on target.
    },
    (actor) => {
        // Target itches (+2 to initiative for 1d10 rounds)
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor}),
            content: "Wild Magic Surge: Target itches (+2 to initiative for 1d10 rounds)."
        });
        // Add effect to target for 1d10 rounds giving it +2 initiative.
    },
    (actor) => {
        // Target's race randomly changes until canceled by dispel magic
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor}),
            content: "Wild Magic Surge: Target's race randomly changes until canceled by dispel magic."
        });
        // Flavor effect.
    },
    (actor) => {
        // Target turns ethereal for 2d4 rounds
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor}),
            content: "Wild Magic Surge: Target turns ethereal for 2d4 rounds."
        });
        // Cast "Etherealness" on the target with a duration of 2d4 rounds.
    },
    (actor) => {
        // Target hastened
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor}),
            content: "Wild Magic Surge: Target hastened."
        });
        // Cast "Haste" on the target.
    },
    (actor) => {
        // All cloth on target crumbles to dust
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor}),
            content: "Wild Magic Surge: All cloth on target crumbles to dust."
        });
        // Get all items on the target, any that are cloth, and destroy them.
    },
    (actor) => {
        // Target sprouts leaves all over their body (-2 AC until removed)
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor}),
            content: "Wild Magic Surge: Target sprouts leaves all over their body (-2 AC until removed)."
        });
        // Add effect to target noting this, the effect should reduce AC by 2.
    },
    (actor) => {
        // Target sprouts new useless appendage (wings, arms, etc.)
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor}),
            content: "Wild Magic Surge: Target sprouts new useless appendage (wings, arms, etc.)."
        });
        // Add effect to target noting this.
    },
    (actor) => {
        // Target changes color (canceled by dispel magic)
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor}),
            content: "Wild Magic Surge: Target changes color (canceled by dispel magic)."
        });
        // Add effect to target noting this.
    },
    (actor) => {
        // Spell has a minimum duration of 1 turn (i.e., it lasts 10 rounds)
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor}),
            content: "Wild Magic Surge: Spell has a minimum duration of 1 turn (i.e., it lasts 10 rounds)."
        });
        // Original spell's duration is changed to 1 turn (10 rounds) if it is less.
    },
    (actor) => {
        // Spell effectiveness (range, duration, area of effect, damage, etc.) increases 200%
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor}),
            content: "Wild Magic Surge: Spell effectiveness (range, duration, area of effect, damage, etc.) increases 200%."
        });
        // Triple all numerical values of the original spell.
    }
]