import WildGem from './wildGem'
import {SOUNDS} from "../constants/moduleData";
import {CompendiumService, PhxConst, UtilityService, TokenService, EffectService} from "@phoenix-modules/common-library";
import {
    animateItchyClothes,
    animateSkunkSmell,
    animateSnakeSpawn,
    animateWallOfForce
} from "../services/animationService";


export const WildEffectFunctions = {
    wallOfForce: async (actor, actorToken, spellCast, target) => {
        
        const secondsDuration = 60; // Duration in  milliseconds (1 minute)
        
        //Get the max distance (In pixels) based on map settings
        const maxDistance = 120 * canvas.grid.size / canvas.grid.distance;
        
        //Half the distance to determine center point of wall
        const halfDistance = maxDistance / 2;
        
        //Center the starting coordinates on the actor (Not the top left corner of the actor image)
        const centerX = actorToken.x + (canvas.grid.size / 2);
        const centerY = actorToken.y + (canvas.grid.size / 2);
        
        // Determine the offset of the current rotation of the actor token (gets one square in front of the token)
        const rotationDeg = actorToken.rotation;
        
        //Due to standard 5e token images pointing down, and 0deg not being down, we make an adjustment here
        //Adding 90 makes the image -> target look correct
        const actorRadians = (rotationDeg + 90) * (Math.PI / 180);
        //Get the offset of 5ft (or grid distance) in front of actor
        const actorOffsetX = Math.cos(actorRadians) * canvas.grid.size;
        const actorOffsetY = Math.sin(actorRadians) * canvas.grid.size;
        
        //Based upon standard rotation, not the adjusted actor rotation
        const standardRadians = rotationDeg * (Math.PI / 180);
        
        //Basically moving the wall to the center
        const wallOffsetX = halfDistance * Math.cos(standardRadians);
        const wallOffsetY = halfDistance * Math.sin(standardRadians);
        
        //take the center of the grid the actor is in, offset it by 5 feet, then center the wall on it.
        const initialX = (centerX + actorOffsetX) - wallOffsetX;
        const initialY = (centerY + actorOffsetY) - wallOffsetY;

        // Create a measured template to represent the wall of force area
        const templateData = {
            t: "ray",
            user: game.user.id,
            hidden: true,
            x: initialX,
            y: initialY,
            direction: rotationDeg,
            distance: 120,
            width: 1,
            borderColor: "#00BFFF",
            fillColor: "#00BFFF"
        };

        const [template] = await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [templateData]);
        
        console.log(template);

        // Play the Wall of Force animation using sequencer and jb2a in each square the wall occupies
        animateWallOfForce(maxDistance, standardRadians, rotationDeg + 90, secondsDuration);        

        // Function to prevent attacks and movement through the wall
        const preventThroughWall = (token, tokenData) => {
            if (!template) return false;

            const startPoint = { x: token.x, y: token.y };
            const endPoint = { x: (tokenData.x !== undefined) ? tokenData.x : token.x, y: (tokenData.y !== undefined) ? tokenData.y : token.y };
            const wallStart = { x: template.x, y: template.y };
            const wallEnd = {
                x: template.x + Math.cos(template.direction * (Math.PI / 180)) * maxDistance,
                y: template.y + Math.sin(template.direction * (Math.PI / 180)) * maxDistance
            };

            // Check if the token's movement or attack path intersects the wall of force
            if (segmentsIntersect(startPoint, endPoint, wallStart, wallEnd)) {
                ui.notifications.warn("You cannot move or attack through the Wall of Force!");
                return false; // Prevent the movement or attack
            }
            return true;
        };

        // Helper function to check if two line segments intersect
        const segmentsIntersect = (p1, q1, p2, q2) => {
            const orientation = (p, q, r) => {
                const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
                if (val === 0) return 0; // Collinear
                return val > 0 ? 1 : 2; // Clockwise or Counterclockwise
            };

            const o1 = orientation(p1, q1, p2);
            const o2 = orientation(p1, q1, q2);
            const o3 = orientation(p2, q2, p1);
            const o4 = orientation(p2, q2, q1);

            return o1 !== o2 && o3 !== o4;
        };

        // Set up hooks to monitor token updates and attacks, and prevent movement and attacks through the wall
        const preUpdateTokenHook = Hooks.on("preUpdateToken", (scene, tokenData, updateData, options, userId) => {
            const token = canvas.tokens.get(tokenData._id);
            if (tokenData.x !== undefined || tokenData.y !== undefined) {
                return preventThroughWall(token, tokenData);
            }
        });

        const preAttackRollHook = Hooks.on("midi-qol.preAttackRoll", (workflow) => {
            const attackerToken = canvas.tokens.get(workflow.tokenId);
            const targetToken = canvas.tokens.get(workflow.targets[0]?.id);
            if (attackerToken && targetToken) {
                return preventThroughWall(attackerToken, { x: targetToken.x, y: targetToken.y });
            }
        });

        // Remove the animation, hooks and template when the effect ends
        
        setTimeout(async () => {
            for (let i = 0; i <= maxDistance; i += stepDistance) {
                Sequencer.EffectManager.endEffects({ name: `wall-of-force-animation-${i / stepDistance}` });
            }
            Hooks.off("preUpdateToken", preUpdateTokenHook);
            Hooks.off("midi-qol.preAttackRoll", preAttackRollHook);


            // Remove the template
            await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [template.id]);
            
        }, secondsDuration * 1000); // Convert to milliseconds
    },
    skunkSmell: async (actor, actorToken, spellCast, target) => {     
        const duration = 600;
        const effectData = {
            label: "Smells like a skunk",
            icon: "icons/magic/acid/orb-bubble-smoke-drip.webp",
            changes: [
                {
                    key: "flags.midi-qol.disadvantage.skill.prc",
                    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                    value: 1
                },
                {
                    key: "flags.midi-qol.disadvantage.skill.int",
                    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                    value: 1
                }
            ],
            origin: actor.uuid,
            duration: {
                seconds: duration,
            }
        };
        
        animateSkunkSmell(actorToken, duration);
        await EffectService.AddEffect(actor, effectData);
    },
    nonPoisonousSnakes: async (actor, actorToken, spellCast, target) => {
        if(!TokenService.IsTokenDocument(actorToken)) return;
        
        // Define the distance and number of tokens to place
        const squaresFromCaster = 3; // distance in pixels
        const numSnakes = 8;
        const snakeItemName = "Poisonous Snake";
        

        // Find the "Poisonous Snake" actor from the compendium or existing actors
        const snakeActorList = await CompendiumService.FindInCompendiums(snakeItemName, PhxConst.COMP_TYPES.Actor);        

        if (snakeActorList.length === 0) {
            ui.notifications.warn("Poisonous Snake actor not found.");
            return;
        }
        
        const snakeActor  = snakeActorList[0];

        //Get the center pixel of the actor based upon grid size, returns { x, y }, 
        const actorCenter = UtilityService.getTokenCenter(actorToken);

        // Calculate positions around the caster
        const radius = squaresFromCaster * canvas.grid.size;
        const positions = UtilityService.calculatePointsOnCircleFromCenter(radius, numSnakes, actorCenter);
        
        const updateData = {
            token: {
                name: `Non Poisonous Snake`,
                disposition: 0,
                alpha: 0,
            }
        }
        
        for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            const location = { x: pos.x, y: pos.y, elevation: actorToken.elevation };
            
            let portal = new Portal().setLocation(location);
            portal.addCreature(snakeActor, { updateData: updateData, count: 1 });
            const token = await portal.spawn();
            animateSnakeSpawn(actorToken, token[0]);
            portal = undefined;
        }
    },
    itchyClothesCaster: async (actor, actorToken, spellCast, target) => {
        const duration = 86400
        const effectData = {
            label: "Itching (-2 Initiative)",
            icon: "icons/magic/control/silhouette-aura-energy.webp",
            changes: [
                {
                    key: "system.attributes.init.bonus",
                    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                    value: -2
                }
            ],
            origin: actor.uuid,
            duration: {
                seconds: duration,
            }
        };
        animateItchyClothes(actorToken, duration);
        await EffectService.AddEffect(actor, effectData);
    },
    lightOnCaster: async (actor, actorToken, spellCast, target) => {
        const durationMs = 3.6e+6;
        
        const lightData = {
            alpha: 0.2,
            angle: 360,
            animation: {
                intensity: 3,
                reverse: false,
                speed: 2,
                type: "torch"
            },
            bright: 20,
            dim: 40            
        }
        
        await actorToken.update({ light: lightData });
        
        setTimeout(() => {}, durationMs)
        
    },
    centerOnCasterSixty: async (actor, actorToken, spellCast, target) => {
        // Modify the original spell to target the caster, if applicable
        // If it has a radius, set it to 60' centered on caster
        const casterToken = canvas.tokens.get(actor.token.id);
        const originalSpell = spellCast;

        // Check if the spell has a target and set it to the caster
        if (originalSpell.data.target.type) {
            originalSpell.data.target = {
                value: 1,
                units: "",
                type: "self"
            };
        }

        // Check if the spell has an area of effect and modify the radius
        if (originalSpell.data.range.units === "ft" && originalSpell.data.range.value > 0) {
            originalSpell.data.range.value = 60;
            originalSpell.data.target = {
                value: 1,
                units: "ft",
                type: "radius"
            };
        }

        // Apply the modified spell to the caster
        actor.createEmbeddedDocuments("Item", [originalSpell]);

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: Spell effect has a 60' radius centered on the caster, or targets the caster if it had a different target."
        });
    },
    nextPhraseTrue: async (actor, actorToken, spellCast, target) => {
        // Create an Active Effect for the next phrase spoken by the caster becoming true
        const effectData = {
            label: "Next Phrase Becomes True",
            icon: "icons/svg/mystery-man.svg", // Use an appropriate icon
            changes: [],
            origin: actor.uuid,
            duration: {
                rounds: 1,
            },
            flags: {
                core: {
                    statusId: "nextPhraseTrue"
                }
            }
        };

        actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: The next phrase spoken by the caster becomes true, lasting for 1 turn."
        });
    },
    casterHairLength: async (actor, actorToken, spellCast, target) => {
        // Add an Active Effect to represent hair growth
        const effectData = {
            label: "Hair Growth",
            icon: "icons/svg/dread.svg", // Use an appropriate icon
            changes: [
                {
                    key: "data.details.hairLength",
                    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                    value: 1
                }
            ],
            origin: actor.uuid,
            duration: {
                seconds: 600, // Duration can be adjusted as needed
            }
        };

        // Check if the actor has a custom attribute for hair length
        if (!actor.data.data.details.hairLength) {
            // If not, add a custom attribute
            actor.update({ "data.details.hairLength": 0 });
        }

        actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: Caster's hair grows one foot in length."
        });
    },
    casterPivot180: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Calculate the new rotation (pivot 180 degrees)
        const newRotation = (casterToken.data.rotation + 180) % 360;

        // Update the caster's token rotation
        casterToken.update({ rotation: newRotation });

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: Caster pivots 180 degrees immediately."
        });
    },
    blackenedFace: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Play the explosion animation using sequencer and jb2a
        new Sequence()
            .effect()
            .file("jb2a.explosion.01.orange") // Path to the JB2A explosion animation
            .atLocation(casterToken)
            .scale(0.5) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        // Create an Active Effect to represent the blackened face
        const effectData = {
            label: "Blackened Face",
            icon: "icons/svg/explosion.svg", // Use an appropriate icon
            changes: [],
            origin: actor.uuid,
            duration: {
                rounds: 10, // Duration can be adjusted as needed
            },
            flags: {
                core: {
                    statusId: "blackenedFace"
                }
            }
        };

        actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: Caster's face is blackened by a small explosion."
        });    
    },
    allergicToItems: async (actor, actorToken, spellCast, target) => {
        // Roll 1d6 to determine the duration
        const durationRoll = new Roll("1d6").roll();
        durationRoll.toMessage();

        // Create an Active Effect to represent the allergy
        const effectData = {
            label: "Allergy to Items",
            icon: "icons/svg/poison.svg", // Use an appropriate icon
            changes: [
                {
                    key: "flags.midi-qol.grants.advantage.attack.all",
                    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                    value: 1
                },
                {
                    key: "data.attributes.ac.value",
                    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                    value: 10 // Assuming 10 is the flat AC; adjust if needed
                },
                {
                    key: "flags.midi-qol.noActions",
                    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                    value: 1
                },
                {
                    key: "flags.midi-qol.noBonusActions",
                    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                    value: 1
                },
                {
                    key: "flags.midi-qol.noReactions",
                    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                    value: 1
                }
            ],
            origin: actor.uuid,
            duration: {
                rounds: durationRoll.total,
            }
        };

        actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: Caster develops an allergy to his items for ${durationRoll.total} turns. During this time, the caster cannot perform any actions, bonus actions, or reactions if he has any items equipped. All attacks against him have advantage, and his AC is considered flat.`
        });
    },
    enlargedHead: async (actor, actorToken, spellCast, target) => {
        // Roll 1d4 to determine the duration
        const durationRoll = new Roll("1d4").roll();
        durationRoll.toMessage();

        // Create an Active Effect to represent the enlarged head
        const effectData = {
            label: "Enlarged Head",
            icon: "icons/svg/head.svg", // Use an appropriate icon
            changes: [],
            origin: actor.uuid,
            duration: {
                rounds: durationRoll.total,
            },
            flags: {
                core: {
                    statusId: "enlargedHead"
                }
            }
        };

        actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: Caster's head enlarges for ${durationRoll.total} turns.`
        });
    },
    reduceCasterSize: async (actor, actorToken, spellCast, target) => {
        // Find the "Enlarge/Reduce" spell from the available spells
        const enlargeReduceSpell = game.items.getName("Enlarge/Reduce");
        if (!enlargeReduceSpell) {
            ui.notifications.warn("Enlarge/Reduce spell not found.");
            return;
        }

        // Clone the spell to cast it on the caster with the "Reduce" effect
        const enlargeReduceSpellClone = enlargeReduceSpell.clone();
        enlargeReduceSpellClone.data.data.level = 2; // Ensure the spell is at the correct level

        // Create an Active Effect to represent the "Reduce" part of the spell
        const effectData = {
            label: "Reduced Size",
            icon: "icons/magic/control/debuff-size-reduction-pink.webp", // Use an appropriate icon
            changes: [
                {
                    key: "data.traits.size",
                    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                    value: "sm"
                },
                {
                    key: "data.bonuses.melee.damage",
                    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                    value: "-1"
                },
                {
                    key: "data.bonuses.rwak.damage",
                    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                    value: "-1"
                },
                {
                    key: "data.bonuses.mwak.damage",
                    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                    value: "-1"
                }
            ],
            origin: actor.uuid,
            duration: {
                rounds: 10, // Duration of the spell effect; adjust as needed
            }
        };

        actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: Caster is affected by Enlarge/Reduce spell with the Reduce effect."
        });
    },
    casterLoveTarget: async (actor, actorToken, spellCast, target) => {
        const currentTime = game.time.worldTime;
        const durationInSeconds = 3600; // Duration set to 1 hour in seconds (effectively permanent until a remove curse is cast)
        const endTime = currentTime + durationInSeconds;

        // Create an Active Effect to represent the caster's infatuation
        const effectData = {
            label: "In Love with Target",
            icon: "icons/svg/hearts.svg", // Use an appropriate icon
            changes: [],
            origin: actor.uuid,
            duration: {
                startTime: currentTime,
                seconds: durationInSeconds,
            },
            flags: {
                core: {
                    statusId: "inLove"
                },
                dae: {
                    specialDuration: ["removeCurse"]
                },
                smalltime: {
                    endTime: endTime
                },
                simpleCalendar: {
                    endTime: endTime
                }
            }
        };

        // Add a custom flag to store the target of affection
        actor.setFlag("world", "loveTarget", target.id);

        actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: Caster falls madly in love with ${target.name} until a remove curse is cast.`
        });
    },
    cannotCancel: async (actor, actorToken, spellCast, target) => {
        // Check if the original spell can be canceled at will by the caster
        const cancelableSpells = ["Concentration"]; // Add other cancelable spell types or names if needed

        if (spellCast.data.components.concentration) {
            // Create an Active Effect to prevent canceling the spell
            const effectData = {
                label: "Spell Cannot Be Canceled",
                icon: "icons/svg/no-cancel.svg", // Use an appropriate icon
                changes: [],
                origin: actor.uuid,
                duration: {
                    seconds: spellCast.data.duration.value * CONFIG.timeUnits[spellCast.data.duration.units],
                },
                flags: {
                    core: {
                        statusId: "noCancel"
                    },
                    dae: {
                        specialDuration: ["turnEnd", "combatEnd"]
                    }
                }
            };

            actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: "Wild Magic Surge: The original spell cannot be canceled at will by the caster."
            });
        } else {
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: "Wild Magic Surge: The original spell is not a concentration spell and does not need to be prevented from being canceled."
            });
        }
    },
    casterRandomPolymorph: async (actor, actorToken, spellCast, target) => {
        // Get a list of actors from the side panel and compendiums
        const sidebarActors = game.actors.contents;
        const compendiumActors = [];

        for (let pack of game.packs) {
            if (pack.documentName === "Actor") {
                const actors = await pack.getDocuments();
                compendiumActors.push(...actors);
            }
        }

        // Combine all actors into one list
        const allActors = sidebarActors.concat(compendiumActors);

        // Choose a random actor from the list
        const randomActor = allActors[Math.floor(Math.random() * allActors.length)];

        if (!randomActor) {
            ui.notifications.warn("No actors found to polymorph into.");
            return;
        }

        // Play the polymorph animation using sequencer and jb2a
        new Sequence()
            .effect()
            .file("jb2a.explosion.blueyellow") // Path to the JB2A Polymorph animation
            .atLocation(canvas.tokens.get(actor.token.id))
            .scale(0.5) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        // Apply polymorph effect by changing the actor's token image and size
        const effectData = {
            label: "Polymorphed",
            icon: "icons/magic/control/debuff-polymorph-pink.webp", // Use an appropriate icon
            changes: [
                {
                    key: "data.token.img",
                    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                    value: randomActor.data.token.img
                },
                {
                    key: "data.token.width",
                    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                    value: randomActor.data.token.width
                },
                {
                    key: "data.token.height",
                    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                    value: randomActor.data.token.height
                },
                {
                    key: "data.token.scale",
                    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                    value: randomActor.data.token.scale || 1
                }
            ],
            origin: actor.uuid,
            duration: {
                rounds: 10, // Adjust duration as needed
            },
            flags: {
                core: {
                    statusId: "polymorphed"
                }
            }
        };

        actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: Caster polymorphs into ${randomActor.name} for 10 rounds.`
        });
    },
    bubblesNoWords: async (actor, actorToken, spellCast, target) => {
        // Create an Active Effect to represent bubbles coming out of the caster's mouth
        const effectData = {
            label: "Bubbles Instead of Words",
            icon: "icons/svg/bubbles.svg", // Use an appropriate icon
            changes: [
                {
                    key: "flags.midi-qol.silenced",
                    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                    value: true
                }
            ],
            origin: actor.uuid,
            duration: {
                rounds: 10, // Adjust duration as needed
            },
            flags: {
                core: {
                    statusId: "bubblesMouth"
                }
            }
        };

        actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: Colorful bubbles come out of the caster's mouth instead of words for 10 rounds."
        });
    },
    reversedTongues: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Find all tokens within 60 feet of the caster
        const tokensWithinRange = canvas.tokens.placeables.filter(token => {
            const distance = Math.hypot(token.x - casterToken.x, token.y - casterToken.y);
            return distance <= 60;
        });

        // Function to create the effect data for removing known languages
        const createEffectData = (token) => ({
            label: "Language Removal",
            icon: "icons/svg/silenced.svg", // Use an appropriate icon
            changes: [
                {
                    key: "data.traits.languages.value",
                    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                    value: []
                }
            ],
            origin: actor.uuid,
            duration: {
                rounds: 10, // Adjust duration as needed
            },
            flags: {
                core: {
                    statusId: "languageRemoved"
                }
            }
        });

        // Apply the effect to all tokens within range
        for (let token of tokensWithinRange) {
            const targetActor = token.actor;
            if (targetActor) {
                const effectData = createEffectData(token);
                await targetActor.createEmbeddedDocuments("ActiveEffect", [effectData]);
            }
        }

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: All known languages are removed from the caster and all creatures within 60 feet for 10 rounds."
        });
    },
    wallOfFire: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Define the radius of the wall of fire
        const radius = 10 * canvas.grid.size; // 10 feet in grid units

        // Play the Wall of Fire animation using sequencer and jb2a
        new Sequence()
            .effect()
            .file("jb2a.wall_of_fire.ring.yellow") // Path to the JB2A Wall of Fire animation
            .atLocation(casterToken)
            .scale(radius / 100) // Adjust the scale based on the radius
            .persist()
            .fadeIn(500)
            .fadeOut(500)
            .name("wall-of-fire-animation") // Name the animation for later removal
            .play();

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: A wall of fire encircles the caster."
        });

        // Function to apply damage if a token enters the wall of fire
        const applyWallOfFireDamage = (token) => {
            if (token.id !== casterToken.id && isTokenInsideCircle(token, casterToken, radius)) {
                // Apply damage to the token
                const damageRoll = new Roll("5d8").roll();
                damageRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor }),
                    flavor: `${token.name} takes damage from the Wall of Fire!`
                });

                const damage = damageRoll.total;
                token.actor.applyDamage(damage);
            }
        };

        // Helper function to check if a token is inside the circle
        const isTokenInsideCircle = (token, centerToken, radius) => {
            const distance = Math.hypot(token.x - centerToken.x, token.y - centerToken.y);
            return distance <= radius;
        };

        // Set up a hook to monitor token movement
        Hooks.on("updateToken", (scene, tokenData, updateData, options, userId) => {
            const token = canvas.tokens.get(tokenData._id);
            applyWallOfFireDamage(token);
        });

        // Apply initial damage to tokens already inside the circle (excluding the caster)
        canvas.tokens.placeables.forEach(token => applyWallOfFireDamage(token));

        // Remove the animation when the effect ends
        const duration = 10 * CONFIG.time.roundTime; // Duration in seconds (10 rounds)
        setTimeout(() => {
            Sequencer.EffectManager.endEffects({ name: "wall-of-fire-animation" });
        }, duration * 1000); // Convert to milliseconds
    },
    enlargeFeet: async (actor, actorToken, spellCast, target) => {
        // Create an Active Effect to represent the enlarged feet
        const effectData = {
            label: "Enlarged Feet",
            icon: "icons/svg/bloody.svg", // Use an appropriate icon
            changes: [
                {
                    key: "data.attributes.movement.walk",
                    mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
                    value: 0.5
                },
                {
                    key: "data.attributes.init.total",
                    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                    value: -4
                }
            ],
            origin: actor.uuid,
            duration: {
                startTime: game.time.worldTime,
                seconds: 3600, // Effectively permanent until a remove curse is cast
            },
            flags: {
                core: {
                    statusId: "enlargedFeet"
                },
                dae: {
                    specialDuration: ["removeCurse"]
                }
            }
        };

        actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: Caster's feet enlarge, reducing movement to half normal and adding -4 to initiative rolls until a remove curse spell is cast."
        });
    },
    duplicateSpellOnCaster: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Ensure there's a valid target
        if (!target) {
            ui.notifications.warn("No target found for the spell.");
            return;
        }        

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: The caster suffers the same spell effect as the target.`
        });

        // Clone the original spell and apply it to the caster
        const spellData = duplicate(spellCast.data);
        spellData._id = foundry.utils.randomID();
        spellData.name = `${spellCast.name} (Reflected)`;

        // Add the new spell to the caster's items
        const createdItems = await actor.createEmbeddedDocuments("Item", [spellData]);

        if (createdItems.length > 0) {
            const newSpell = createdItems[0];

            // Use the new spell on the caster
            const options = { showFullCard: false, createMeasuredTemplate: false, configureDialog: false };
            const workflow = await MidiQOL.completeItemUse(newSpell, {}, { target: [casterToken] });
        }
    },
    levitateCaster: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);        

        // Find the "Levitate" spell from the available spells or compendium
        const levitateSpell = game.items.getName("Levitate");
        if (!levitateSpell) {
            ui.notifications.warn("Levitate spell not found.");
            return;
        }

        // Clone the spell to cast it on the caster
        const levitateSpellClone = levitateSpell.clone();
        levitateSpellClone.data.data.level = 2; // Ensure the spell is at the correct level

        // Apply the spell to the caster
        const options = { showFullCard: false, createMeasuredTemplate: false, configureDialog: false };
        const workflow = await MidiQOL.completeItemUse(levitateSpellClone, {}, { target: [casterToken] });

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: Caster is affected by the Levitate spell."
        });
    },
    fearOnCaster: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);        

        // Find the "Fear" spell from the available spells or compendium
        const fearSpell = game.items.getName("Fear");
        if (!fearSpell) {
            ui.notifications.warn("Fear spell not found.");
            return;
        }

        // Clone the spell to cast it centered on the caster
        const fearSpellClone = fearSpell.clone();
        fearSpellClone.data.data.range = { value: 60, long: 60, units: "ft" }; // Set the range to 60 feet
        fearSpellClone.data.data.target = { value: null, width: 60, units: "ft", type: "sphere" }; // Set the target type to sphere with 60 feet radius

        // Apply the Fear effect to all tokens within 60 feet of the caster, excluding the caster
        const tokensWithinRange = canvas.tokens.placeables.filter(token => {
            const distance = Math.hypot(token.x - casterToken.x, token.y - casterToken.y);
            return distance <= 60 * canvas.grid.size && token.id !== casterToken.id;
        });

        for (let token of tokensWithinRange) {
            const effectData = duplicate(fearSpellClone.data.data.effects[0]); // Assume the Fear spell has an effect in its data
            effectData.origin = actor.uuid;
            await token.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
        }

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: Caster casts Fear, centered on themselves with a 60 feet radius, ignoring the caster."
        });
    },
    squeakyVoice: async (actor, actorToken, spellCast, target) => {
        // Roll 1d6 to determine the duration in days
        const durationRoll = new Roll("1d6").roll();
        durationRoll.toMessage();

        // Create an Active Effect to represent the squeaky voice
        const effectData = {
            label: "Squeaky Voice",
            icon: "icons/svg/speech-bubble.svg", // Use an appropriate icon
            changes: [],
            origin: actor.uuid,
            duration: {
                days: durationRoll.total,
            },
            flags: {
                core: {
                    statusId: "squeakyVoice"
                }
            }
        };

        actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: Caster speaks in a squeaky voice for ${durationRoll.total} days.`
        });
    },
    xRayVision: async (actor, actorToken, spellCast, target) => {
        // Roll 1d6 to determine the duration in rounds
        const durationRoll = new Roll("1d6").roll();
        durationRoll.toMessage();

        // Create an Active Effect to represent X-ray vision
        const effectData = {
            label: "X-ray Vision",
            icon: "icons/magic/perception/eye-ray-blue.webp", // Use an appropriate icon
            changes: [
                {
                    key: "data.attributes.senses.sight",
                    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                    value: "X-ray"
                }
            ],
            origin: actor.uuid,
            duration: {
                rounds: durationRoll.total,
            },
            flags: {
                core: {
                    statusId: "xrayVision"
                }
            }
        };

        actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: Caster gains X-ray vision for ${durationRoll.total} rounds.`
        });
    },
    ageTenYears: async (actor, actorToken, spellCast, target) => {
        // Create an Active Effect to represent aging 10 years
        const effectData = {
            label: "Aged 10 Years",
            icon: "icons/magic/time/clock-glow-blue.webp", // Use an appropriate icon
            changes: [
                {
                    key: "data.details.age",
                    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                    value: 10
                }
            ],
            origin: actor.uuid,
            duration: {
                permanent: true,
            },
            flags: {
                core: {
                    statusId: "aged10Years"
                }
            }
        };

        actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: Caster ages 10 years."
        });
    },
    silenceOnCaster: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);
        
        // Find the "Silence" spell from the available spells or compendium
        const silenceSpell = game.items.getName("Silence");
        if (!silenceSpell) {
            ui.notifications.warn("Silence spell not found.");
            return;
        }

        // Clone the spell to cast it centered on the caster
        const silenceSpellClone = silenceSpell.clone();
        silenceSpellClone.data.data.range = { value: 0, long: null, units: "self" }; // Set the range to self
        silenceSpellClone.data.data.target = { value: null, width: 20, units: "ft", type: "sphere" }; // Set the target type to sphere with 20 feet radius

        // Create the measured template for the silence area
        const templateData = {
            t: "circle",
            user: game.user.id,
            x: casterToken.x + canvas.grid.size / 2,
            y: casterToken.y + canvas.grid.size / 2,
            direction: 0,
            distance: 20, // 20 feet radius
            borderColor: "#0000FF",
            fillColor: "#0000FF"
        };

        await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [templateData]);

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: Caster casts Silence, centered on themselves with a 20 feet radius."
        });

        // Apply the Silence effect to the area
        const tokensWithinRange = canvas.tokens.placeables.filter(token => {
            const distance = Math.hypot(token.x - casterToken.x, token.y - casterToken.y);
            return distance <= 20 * canvas.grid.size;
        });

        for (let token of tokensWithinRange) {
            const effectData = duplicate(silenceSpellClone.data.data.effects[0]); // Assume the Silence spell has an effect in its data
            effectData.origin = actor.uuid;
            await token.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
        }
    },
    pitCaster: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Determine the location for the pit based on caster's rotation
        const rotation = casterToken.data.rotation;
        const distance = 10 * canvas.grid.size; // 10 feet in grid units
        const radians = rotation * (Math.PI / 180);
        const x = casterToken.x + Math.cos(radians) * distance;
        const y = casterToken.y + Math.sin(radians) * distance;

        // Play the pit creation animation using sequencer and jb2a
        new Sequence()
            .effect()
            .file("jb2a.impact.ground_crack.orange.01") // Path to the JB2A ground cracks or pit animation
            .atLocation({ x, y })
            .scale(0.5) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        // Create a tile to represent the pit
        const pitTile = {
            img: "path/to/pit/image.png", // Path to your pit image
            x: x,
            y: y,
            width: canvas.grid.size * 2, // 10 feet wide
            height: canvas.grid.size * 2, // 10 feet high
            rotation: 0,
            z: 0,
            alpha: 1,
            hidden: false,
            locked: false
        };

        await canvas.scene.createEmbeddedDocuments("Tile", [pitTile]);

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: A 10'x10' pit appears immediately in front of the caster."
        });

        // Function to check if a token falls into the pit
        const checkPitFall = (token) => {
            const tokenCenter = { x: token.x + token.width / 2, y: token.y + token.height / 2 };
            const pitCenter = { x: x + canvas.grid.size, y: y + canvas.grid.size };
            const distance = Math.hypot(tokenCenter.x - pitCenter.x, tokenCenter.y - pitCenter.y);
            return distance <= canvas.grid.size; // Check if the token is within the pit's area
        };

        // Hook to monitor token updates and check if a token falls into the pit
        const preUpdateTokenHook = Hooks.on("preUpdateToken", (scene, tokenData, updateData, options, userId) => {
            const token = canvas.tokens.get(tokenData._id);
            if (checkPitFall(token)) {
                ui.notifications.warn(`${token.name} falls into the pit!`);
                // You can apply additional effects to the token here, such as reducing HP or applying a condition
            }
        });

        // Remove the pit and hook after a set duration
        const duration = 10 * CONFIG.time.roundTime; // Duration in seconds (10 rounds)
        setTimeout(() => {
            canvas.scene.deleteEmbeddedDocuments("Tile", [pitTile._id]);
            Hooks.off("preUpdateToken", preUpdateTokenHook);
        }, duration * 1000); // Convert to milliseconds
    },
    reverseGravity: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);
        
        // Create an Active Effect to represent the reverse gravity
        const effectData = {
            label: "Reverse Gravity",
            icon: "icons/magic/air/wind-tornado-blue.webp", // Use an appropriate icon
            changes: [],
            origin: actor.uuid,
            duration: {
                rounds: 1, // Lasts for 1 round
            },
            flags: {
                core: {
                    statusId: "reverseGravity"
                }
            }
        };

        actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

        // Apply the reverse gravity effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: Gravity reverses beneath the caster's feet for 1 round."
        });

        // Optional: Apply additional effects such as moving the caster upwards
        const reverseGravityEffect = async () => {
            // Get the caster's token and current position
            const casterToken = canvas.tokens.get(actor.token.id);
            const currentY = casterToken.y;

            // Move the caster upwards
            await casterToken.update({ y: currentY - canvas.grid.size * 2 }); // Adjust the movement distance as needed

            // Return the caster to the original position after 1 round
            setTimeout(async () => {
                await casterToken.update({ y: currentY });
            }, CONFIG.time.roundTime * 1000); // Convert to milliseconds
        };

        reverseGravityEffect();
    },
    streamers: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Play the colored streamers animation using sequencer and jb2a
        new Sequence()
            .effect()
            .file("jb2a.magic_missile.blue") // Path to a suitable JB2A streamers animation
            .atLocation(casterToken)
            .stretchTo({ x: casterToken.x + canvas.grid.size * 2, y: casterToken.y }) // Adjust as needed
            .scale(0.5) // Adjust scale as needed
            .fadeIn(500)
            .effect()
            .file("jb2a.magic_missile.green") // Path to a suitable JB2A streamers animation
            .delay(500, 1000)
            .atLocation(casterToken)
            .stretchTo({ x: casterToken.x + canvas.grid.size * 2, y: casterToken.y }) // Adjust as needed
            .scale(0.5)
            .effect()
            .file("jb2a.magic_missile.grey") // Path to a suitable JB2A streamers animation
            .delay(500, 1000)
            .atLocation(casterToken)
            .stretchTo({ x: casterToken.x + canvas.grid.size * 2, y: casterToken.y }) // Adjust as needed
            .scale(0.5)
            .effect()
            .file("jb2a.magic_missile.orange") // Path to a suitable JB2A streamers animation
            .delay(1, 1000)
            .atLocation(casterToken)
            .stretchTo({ x: casterToken.x + canvas.grid.size * 2, y: casterToken.y }) // Adjust as needed
            .scale(0.5)
            .effect()
            .file("jb2a.magic_missile.purple") // Path to a suitable JB2A streamers animation
            .delay(100, 1000)
            .atLocation(casterToken)
            .stretchTo({ x: casterToken.x + canvas.grid.size * 2, y: casterToken.y }) // Adjust as needed
            .scale(0.5)
            .effect()
            .file("jb2a.magic_missile.yellow") // Path to a suitable JB2A streamers animation
            .delay(200, 1000)
            .atLocation(casterToken)
            .stretchTo({ x: casterToken.x + canvas.grid.size * 2, y: casterToken.y }) // Adjust as needed
            .scale(0.5)
            .play();

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: Colored streamers pour from the caster's fingertips."
        });
    },
    reboundSpell: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: The spell effect rebounds on the caster."
        });

        // Prevent the original spell from affecting the target by stopping its execution
        Hooks.once("midi-qol.preItemRoll", workflow => {
            if (workflow.item.id === spellCast.id) {
                workflow.targets = new Set(); // Clear targets
            }
        });

        // Clone the original spell and apply it to the caster
        const spellData = duplicate(spellCast.data);
        spellData._id = foundry.utils.randomID();
        spellData.name = `${spellCast.name} (Rebounded)`;

        // Add the new spell to the caster's items
        const createdItems = await actor.createEmbeddedDocuments("Item", [spellData]);

        if (createdItems.length > 0) {
            const newSpell = createdItems[0];

            // Use the new spell on the caster
            const options = { showFullCard: false, createMeasuredTemplate: false, configureDialog: false };
            const workflow = await MidiQOL.completeItemUse(newSpell, {}, { target: [casterToken] });
        }
    },
    casterInvisible: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);        

        // Find the "Invisibility" spell from the available spells or compendium
        const invisibilitySpell = game.items.getName("Invisibility");
        if (!invisibilitySpell) {
            ui.notifications.warn("Invisibility spell not found.");
            return;
        }

        // Clone the spell to cast it on the caster
        const invisibilitySpellClone = invisibilitySpell.clone();
        invisibilitySpellClone.data.data.level = 2; // Ensure the spell is at the correct level

        // Apply the Invisibility effect to the caster
        const effectData = {
            label: "Invisibility",
            icon: "icons/magic/air/invisibility-potion-bottle-blue.webp", // Use an appropriate icon
            changes: [
                {
                    key: "data.attributes.ac.bonus",
                    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                    value: 0
                },
                {
                    key: "data.attributes.hp.temp",
                    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                    value: 0
                },
                {
                    key: "data.traits.invisible",
                    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                    value: true
                }
            ],
            origin: actor.uuid,
            duration: {
                seconds: 3600, // Duration can be adjusted as needed
            },
            flags: {
                core: {
                    statusId: "invisible"
                }
            }
        };

        await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: Caster is affected by the Invisibility spell."
        });

        // Optionally, make the caster's token transparent to indicate invisibility
        await casterToken.update({ alpha: 0.5 });
    },
    colorSpray: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Determine the direction the caster is facing
        const rotation = casterToken.data.rotation;
        const radians = rotation * (Math.PI / 180);

        // Calculate the end point of the cone
        const distance = 15 * canvas.grid.size; // 15 feet cone
        const endX = casterToken.x + Math.cos(radians) * distance;
        const endY = casterToken.y + Math.sin(radians) * distance;

        

        // Find the "Color Spray" spell from the available spells or compendium
        const colorSpraySpell = game.items.getName("Color Spray");
        if (!colorSpraySpell) {
            ui.notifications.warn("Color Spray spell not found.");
            return;
        }

        // Clone the spell to cast it
        const colorSpraySpellClone = colorSpraySpell.clone();
        colorSpraySpellClone.data.data.level = 1; // Ensure the spell is at the correct level

        // Create a measured template for the Color Spray cone
        const templateData = {
            t: "cone",
            user: game.user.id,
            x: casterToken.x + canvas.grid.size / 2,
            y: casterToken.y + canvas.grid.size / 2,
            direction: rotation,
            distance: 15,
            angle: 30,
            borderColor: "#FF4500",
            fillColor: "#FF6347",
            flags: {
                spellEffect: {
                    spellName: "Color Spray",
                    casterId: actor.id
                }
            }
        };

        await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [templateData]);

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: Caster casts Color Spray in the direction they are facing."
        });
    },
    butterflies: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Play the butterflies animation using sequencer and jb2a
        new Sequence()
            .effect()
            .file("jb2a.butterflies.many") // Path to the JB2A butterflies animation
            .atLocation(casterToken)            
            .scale(0.5) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: A stream of butterflies pours from the caster's mouth."
        });
    },
    monsterFootprints: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Create an Active Effect to represent the monster-shaped footprints
        const effectData = {
            label: "Monster-Shaped Footprints",
            icon: "icons/magic/nature/paw-print-footprint-brown.webp", // Use an appropriate icon
            changes: [],
            origin: actor.uuid,
            duration: {
                seconds: 3600, // Lasts until a remove curse spell is cast
            },
            flags: {
                core: {
                    statusId: "monsterFootprints"
                },
                dae: {
                    specialDuration: ["removeCurse"]
                }
            }
        };

        actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

        // Function to create footprint tiles
        const createFootprint = (position) => {
            const tileData = {
                img: "path/to/monster-footprint-image.png", // Path to your monster footprint image
                x: position.x,
                y: position.y,
                width: canvas.grid.size,
                height: canvas.grid.size,
                rotation: 0,
                z: 0,
                alpha: 1,
                hidden: false,
                locked: false
            };
            canvas.scene.createEmbeddedDocuments("Tile", [tileData]);
        };

        // Hook to monitor token movement and leave footprints
        const createFootprintHook = Hooks.on("updateToken", (scene, tokenData, updateData, options, userId) => {
            const token = canvas.tokens.get(tokenData._id);
            if (token.id === casterToken.id) {
                createFootprint({ x: token.x, y: token.y });
            }
        });

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: The caster leaves monster-shaped footprints instead of his own until a remove curse spell is cast on him."
        });

        // Remove the hook when the effect ends
        const duration = 3600; // 1 hour in seconds (adjust as needed)
        setTimeout(() => {
            Hooks.off("updateToken", createFootprintHook);
        }, duration * 1000); // Convert to milliseconds
    },
    gemSpray: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Roll 3d10 to determine the number of gems
        const numGemsRoll = new Roll("3d10").roll();
        numGemsRoll.toMessage();
        const numGems = numGemsRoll.total;

        // Create gems and set their value
        const gems = [];
        for (let i = 0; i < numGems; i++) {
            const gemValueRoll = new Roll("1d6 * 10").roll();
            const gem = new WildGem(i + 1, gemValueRoll.total).gem;
            gems.push(gem);
        }

        // Add gems to caster's inventory
        await actor.createEmbeddedDocuments("Item", gems);

        // Play an animation using sequencer and jb2a to show gems shooting from the caster's fingertips
        new Sequence()
            .effect()
            .file("jb2a.ioun_stones.02") // Path to a suitable JB2A animation for shooting gems
            .atLocation(casterToken)
            .stretchTo({
                x: casterToken.x + canvas.grid.size * 2,
                y: casterToken.y
            }) // Adjust as needed
            .scale(0.5) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: ${numGems} gems shoot from the caster's fingertips.`
        });
    },
    music: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Play a musical animation using sequencer and jb2a
        new Sequence()
            .effect()
            .file("jb2a.bardic_inspiration") // Path to a suitable JB2A musical animation
            .atLocation(casterToken)
            .scale(0.5) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        // Optionally, play a sound
        AudioHelper.play({ src: "path/to/music.mp3", volume: 0.8, autoplay: true, loop: false });

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: Music fills the air around the caster."
        });
    },
    createFoodAndWater: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Find the "Create Food and Water" spell from the available spells or compendium
        const createFoodAndWaterSpell = game.items.getName("Create Food and Water");
        if (!createFoodAndWaterSpell) {
            ui.notifications.warn("Create Food and Water spell not found.");
            return;
        }

        // Clone the spell to cast it
        const createFoodAndWaterSpellClone = createFoodAndWaterSpell.clone();
        createFoodAndWaterSpellClone.data.data.level = 3; // Ensure the spell is at the correct level

        // Add the new spell to the caster's items
        const createdItems = await actor.createEmbeddedDocuments("Item", [createFoodAndWaterSpellClone]);

        if (createdItems.length > 0) {
            const newSpell = createdItems[0];

            // Use the new spell on the caster's location
            const options = { showFullCard: false, createMeasuredTemplate: false, configureDialog: false };
            const workflow = await MidiQOL.completeItemUse(newSpell, {}, { target: [casterToken] });
        }

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: The caster casts Create Food and Water."
        });
    },
    extinguishLights: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Calculate the range for extinguishing lights (60 feet)
        const range = 60 * canvas.grid.size;

        // Find all light sources within 60 feet of the caster
        const lightsWithinRange = canvas.scene.lights.filter(light => {
            const distance = Math.hypot(light.x - casterToken.x, light.y - casterToken.y);
            return distance <= range;
        });

        // Extinguish non-magical lights
        for (let light of lightsWithinRange) {
            // Assuming non-magical lights can be distinguished by a flag or some property
            // Here we assume lights without a specific "magical" flag are non-magical
            if (!light.getFlag("world", "magical")) {
                await light.update({ hidden: true });
            }
        }

        // Play an animation using sequencer and jb2a to show the lights extinguishing
        new Sequence()
            .effect()
            .file("jb2a.markers.light.outro.yellow02") // Path to a suitable JB2A animation for lights extinguishing
            .atLocation(casterToken)
            .scale(1) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: Non-magical lights within 60 feet of the caster are extinguished."
        });
    },
    deMagicItem: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Calculate the range for finding magical items (30 feet)
        const range = 30 * canvas.grid.size;

        // Find all tokens within 30 feet of the caster
        const tokensWithinRange = canvas.tokens.placeables.filter(token => {
            const distance = Math.hypot(token.x - casterToken.x, token.y - casterToken.y);
            return distance <= range;
        });

        // Collect all magical items within range
        let magicalItems = [];
        for (let token of tokensWithinRange) {
            let items = token.actor.items.filter(item => item.data.data.rarity && item.data.data.rarity !== "common");
            magicalItems.push(...items);
        }

        // If there are no magical items, do nothing
        if (magicalItems.length === 0) {
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: "Wild Magic Surge: No magical items within 30 feet of the caster."
            });
            return;
        }

        // Choose one random magical item
        const randomItem = magicalItems[Math.floor(Math.random() * magicalItems.length)];

        // Make the chosen item permanently non-magical
        await randomItem.update({
            "data.rarity": "common",
            "data.properties": {},
            "data.uses": { value: 0, max: 0 },
            "data.ability": "",
            "data.attunement": 0,
            "data.chargeable": false,
            "data.charges": { value: 0, max: 0 }
        });

        // Play an animation using sequencer and jb2a to show the item losing its magic
        new Sequence()
            .effect()
            .file("jb2a.explosion.04.dark_purple") // Path to a suitable JB2A animation for magic dissipating
            .atLocation(casterToken)
            .scale(1) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: ${randomItem.name} within 30 feet of the caster is permanently non-magical.`
        });
    },
    magicAnItem: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Calculate the range for finding normal items (30 feet)
        const range = 30 * canvas.grid.size;

        // Find all tokens within 30 feet of the caster
        const tokensWithinRange = canvas.tokens.placeables.filter(token => {
            const distance = Math.hypot(token.x - casterToken.x, token.y - casterToken.y);
            return distance <= range;
        });

        // Collect all normal items within range
        let normalItems = [];
        for (let token of tokensWithinRange) {
            let items = token.actor.items.filter(item => !item.data.data.rarity || item.data.data.rarity === "common");
            normalItems.push(...items);
        }

        // If there are no normal items, do nothing
        if (normalItems.length === 0) {
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: "Wild Magic Surge: No normal items within 30 feet of the caster."
            });
            return;
        }

        // Choose one random normal item
        const randomItem = normalItems[Math.floor(Math.random() * normalItems.length)];

        // Determine the type of item and apply the appropriate enchantment
        let updateData = {
            "data.rarity": "uncommon",
            "data.properties": { magical: true }, // Add a simple magical property
            "data.attunement": 1 // Example: require attunement
        };

        if (randomItem.type === "weapon") {
            updateData["data.attackBonus"] = 1;
            updateData["data.damage.parts"] = randomItem.data.data.damage.parts.map(part => [`${part[0]} + 1`, part[1]]);
        } else if (randomItem.type === "armor") {
            updateData["data.armor.value"] = randomItem.data.data.armor.value + 1;
        } else {
            // Choose a random spell from the spell compendium
            const spells = game.packs.get("dnd5e.spells");
            const spellList = await spells.getDocuments();
            const randomSpell = spellList[Math.floor(Math.random() * spellList.length)];

            updateData["data.uses"] = { value: 0, max: 0 }; // No charges required
            updateData["data.activation"] = { type: "action", cost: 1, condition: "" };
            updateData["data.range"] = randomSpell.data.data.range;
            updateData["data.target"] = randomSpell.data.data.target;
            updateData["data.duration"] = randomSpell.data.data.duration;
            updateData["data.ability"] = randomSpell.data.data.ability;
            updateData["data.attackBonus"] = randomSpell.data.data.attackBonus;
            updateData["data.damage"] = randomSpell.data.data.damage;
            updateData["data.save"] = randomSpell.data.data.save;
        }

        // Apply the enchantment to the item
        await randomItem.update(updateData);

        // Play an animation using sequencer and jb2a to show the item becoming enchanted
        new Sequence()
            .effect()
            .file("jb2a.explosion.06.bluewhite") // Path to a suitable JB2A animation for enchanting
            .atLocation(casterToken)
            .scale(1) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: ${randomItem.name} within 30 feet of the caster is permanently enchanted.`
        });
    },
    invisibleAnItem: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Calculate the range for finding magical weapons (30 feet)
        const range = 30 * canvas.grid.size;

        // Roll 1d4 to determine the duration in rounds
        const durationRoll = new Roll("1d4").roll();
        durationRoll.toMessage();
        const duration = durationRoll.total;

        // Find all tokens within 30 feet of the caster
        const tokensWithinRange = canvas.tokens.placeables.filter(token => {
            const distance = Math.hypot(token.x - casterToken.x, token.y - casterToken.y);
            return distance <= range;
        });

        // Collect all magical weapons within range
        let magicalWeapons = [];
        for (let token of tokensWithinRange) {
            let items = token.actor.items.filter(item => item.type === "weapon" && item.data.data.properties.magical);
            magicalWeapons.push(...items);
        }

        // If there are no magical weapons, do nothing
        if (magicalWeapons.length === 0) {
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: "Wild Magic Surge: No magical weapons within 30 feet of the caster."
            });
            return;
        }

        // Make each magical weapon invisible and unusable for the duration
        for (let weapon of magicalWeapons) {
            // Apply an active effect to make the weapon invisible and unusable
            const effectData = {
                label: "Invisible and Unusable",
                icon: "icons/magic/air/wind-tornado-blue.webp", // Use an appropriate icon
                changes: [
                    {
                        key: "data.attributes.hp.temp",
                        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                        value: 0
                    },
                    {
                        key: "data.ability",
                        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                        value: "none"
                    },
                    {
                        key: "data.equipped",
                        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                        value: false
                    }
                ],
                origin: actor.uuid,
                duration: {
                    rounds: duration,
                },
                flags: {
                    core: {
                        statusId: "invisibleAndUnusable"
                    }
                }
            };

            await weapon.update({ "data.equipped": false, "data.invisible": true });
            await weapon.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
        }

        // Play an animation using sequencer and jb2a to show the weapons becoming invisible
        new Sequence()
            .effect()
            .file("jb2a.invisibility.fade_out") // Path to a suitable JB2A animation for making weapons invisible
            .atLocation(casterToken)
            .scale(1) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: All magical weapons within 30 feet of the caster are invisible and unusable for ${duration} rounds.`
        });

        // Remove the effect after the duration
        setTimeout(async () => {
            for (let weapon of magicalWeapons) {
                await weapon.update({ "data.equipped": true, "data.invisible": false });
                const effects = weapon.actor.effects.filter(effect => effect.data.label === "Invisible and Unusable");
                for (let effect of effects) {
                    await weapon.actor.deleteEmbeddedDocuments("ActiveEffect", [effect.id]);
                }
            }
        }, duration * CONFIG.time.roundTime * 1000); // Convert to milliseconds
    },
    smokeyEars: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Calculate the range for finding creatures (60 feet)
        const range = 60 * canvas.grid.size;

        // Find all tokens within 60 feet of the caster
        const tokensWithinRange = canvas.tokens.placeables.filter(token => {
            const distance = Math.hypot(token.x - casterToken.x, token.y - casterToken.y);
            return distance <= range;
        });

        // Play a smoke effect using sequencer and jb2a at each creature's ears
        for (let token of tokensWithinRange) {
            new Sequence()
                .effect()
                .file("jb2a.smoke.plumes.01.grey") // Path to a suitable JB2A smoke animation
                .atLocation(token)
                .stretchTo({
                    x: token.x + canvas.grid.size * 0.1,
                    y: token.y - canvas.grid.size * 0.5
                }) // Adjust to simulate smoke coming from ears
                .scale(0.5) // Adjust scale as needed
                .fadeIn(500)
                .fadeOut(500)
                .play();
        }

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: Smoke pours from the ears of all creatures within 60 feet of the caster."
        });
    },
    dancingLights: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Find the "Dancing Lights" spell from the available spells or compendium
        const dancingLightsSpell = game.items.getName("Dancing Lights");
        if (!dancingLightsSpell) {
            ui.notifications.warn("Dancing Lights spell not found.");
            return;
        }

        // Clone the spell to cast it
        const dancingLightsSpellClone = dancingLightsSpell.clone();
        dancingLightsSpellClone.data.data.level = 0; // Ensure the spell is at the correct level

        // Add the new spell to the caster's items
        const createdItems = await actor.createEmbeddedDocuments("Item", [dancingLightsSpellClone]);

        if (createdItems.length > 0) {
            const newSpell = createdItems[0];

            // Use the new spell on the caster's location
            const options = { showFullCard: false, createMeasuredTemplate: false, configureDialog: false };
            const workflow = await MidiQOL.completeItemUse(newSpell, {}, { target: [casterToken] });
        }

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: The caster casts Dancing Lights."
        });
    },
    hiccup: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Calculate the range for finding creatures (30 feet)
        const range = 30 * canvas.grid.size;

        // Find all tokens within 30 feet of the caster
        const tokensWithinRange = canvas.tokens.placeables.filter(token => {
            const distance = Math.hypot(token.x - casterToken.x, token.y - casterToken.y);
            return distance <= range;
        });

        // Apply hiccup effect to each creature within range
        for (let token of tokensWithinRange) {
            // Create an Active Effect to represent the hiccup effect
            const effectData = {
                label: "Hiccup",
                icon: "icons/svg/regen.svg", // Use an appropriate icon
                changes: [],
                origin: actor.uuid,
                duration: {
                    rounds: 10, // Duration can be adjusted as needed
                },
                flags: {
                    core: {
                        statusId: "hiccup"
                    },
                    dae: {
                        macroRepeat: "endEveryTurn",
                        specialDuration: ["turnEndSource"]
                    }
                }
            };

            await token.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

            // Function to play hiccup animation and sound
            const playHiccup = () => {
                new Sequence()
                    .effect()
                    .file("jb2a.smoke.puff.centered.green") // Path to a suitable JB2A animation for hiccup effect
                    .atLocation(token)
                    .scale(0.5) // Adjust scale as needed
                    .fadeIn(500)
                    .fadeOut(500)
                    .play();

                // Optionally, play a hiccup sound
                AudioHelper.play({ src: "path/to/hiccup.mp3", volume: 0.5, autoplay: true, loop: false });
            };

            // Schedule hiccup animation and sound randomly while the effect is active
            for (let i = 0; i < 10; i++) {
                setTimeout(playHiccup, Math.random() * (10 * CONFIG.time.roundTime * 1000));
            }
        }

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: All creatures within 30 feet of the caster begin to hiccup."
        });
    },
    knock: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Calculate the range for finding doors (60 feet)
        const range = 60 * canvas.grid.size;

        // Find all doors within 60 feet of the caster
        const doorsWithinRange = canvas.scene.data.walls.filter(wall => {
            const door = wall.data.door;
            if (!door) return false;

            const distance = Math.hypot((wall.data.c[0] + wall.data.c[2]) / 2 - casterToken.x, (wall.data.c[1] + wall.data.c[3]) / 2 - casterToken.y);
            return distance <= range;
        });

        // Open each door within range
        for (let door of doorsWithinRange) {
            await canvas.scene.updateEmbeddedDocuments("Wall", [{ _id: door.id, ds: CONST.WALL_DOOR_STATES.OPEN }]);
        }

        // Play an animation using sequencer and jb2a to show the doors opening
        new Sequence()
            .effect()
            .file("jb2a.shield.01.outro_explode.blue") // Path to a suitable JB2A animation for opening doors
            .atLocation(casterToken)
            .scale(1) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: All doors within 60 feet of the caster open."
        });
    },
    swapWithTarget: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Ensure a target is selected
        if (!target) {
            ui.notifications.warn("No target selected.");
            return;
        }

        // Get the target's token
        const targetToken = canvas.tokens.get(target.id);

        // Store the original positions
        const casterPosition = { x: casterToken.x, y: casterToken.y };
        const targetPosition = { x: targetToken.x, y: targetToken.y };

        // Play an animation using sequencer and jb2a to show the teleportation effect
        new Sequence()
            .effect()
            .file("jb2a.misty_step.01.blue") // Path to a suitable JB2A animation for teleportation
            .atLocation(casterToken)
            .fadeIn(500)
            .fadeOut(500)
            .play();

        new Sequence()
            .effect()
            .file("jb2a.misty_step.01.blue") // Path to a suitable JB2A animation for teleportation
            .atLocation(targetToken)
            .fadeIn(500)
            .fadeOut(500)
            .play();

        // Swap positions
        await casterToken.update(targetPosition);
        await targetToken.update(casterPosition);

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: The caster and target exchange places."
        });
    },
    newRandomTarget: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Calculate the range for finding possible targets (60 feet)
        const range = 60 * canvas.grid.size;

        // Find all possible targets within 60 feet of the caster
        const possibleTargets = canvas.tokens.placeables.filter(token => {
            const distance = Math.hypot(token.x - casterToken.x, token.y - casterToken.y);
            return distance <= range && token.id !== casterToken.id;
        });

        // If there are no possible targets, do nothing
        if (possibleTargets.length === 0) {
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: "Wild Magic Surge: No possible targets within 60 feet."
            });
            return;
        }

        // Choose one random target from the possible targets
        const newTarget = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];       

        // Update the spell's target
        await spellCast.update({ "data.target": newTarget.id });

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: The spell is redirected to ${newTarget.name}.`
        });
    },
    preventSpell: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Prevent the original spell from taking effect and ensure the spell slot is not consumed
        Hooks.once("midi-qol.preItemRoll", workflow => {
            if (workflow.item.id === spellCast.id) {
                workflow.targets = new Set(); // Clear targets to prevent the spell from taking effect
                workflow.item.update({ "data.uses.value": workflow.item.data.uses.value + 1 }); // Refund the spell slot
            }
        });

        // Play an animation using sequencer and jb2a to show the spell failing
        new Sequence()
            .effect()
            .file("jb2a.explosion.dark_red") // Path to a suitable JB2A animation for spell failure
            .atLocation(casterToken)
            .scale(1) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: The caster's spell fails, but it does not consume a spell slot."
        });
    },
    elementalSummon: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Play an animation using sequencer and jb2a to show the conjuration effect
        new Sequence()
            .effect()
            .file("jb2a.magic_signs.circle.02.conjuration.complete.yellow") // Path to a suitable JB2A animation for conjuring elementals
            .atLocation(casterToken)
            .scale(1) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        // Define the possible elementals
        const elementals = ["Earth Elemental", "Fire Elemental", "Air Elemental", "Water Elemental"];

        // Choose a random elemental
        const randomElemental = elementals[Math.floor(Math.random() * elementals.length)];
        
        // Calculate the position next to the caster
        const adjacentPositions = [
            { x: casterToken.x + canvas.grid.size, y: casterToken.y },
            { x: casterToken.x - canvas.grid.size, y: casterToken.y },
            { x: casterToken.x, y: casterToken.y + canvas.grid.size },
            { x: casterToken.x, y: casterToken.y - canvas.grid.size }
        ];

        const position = adjacentPositions[Math.floor(Math.random() * adjacentPositions.length)];

        // Use Warpgate to summon the random elemental
        await warpgate.spawn(randomElemental, {
            token: { x: position.x, y: position.y }
        });

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: The caster also summons a ${randomElemental}.`
        });
    },
    weatherChange: async (actor, actorToken, spellCast, target) => {
        // Define possible weather conditions
        const weatherConditions = [
            "a sunny and clear sky",
            "a light drizzle",
            "a heavy downpour",
            "a thunderstorm",
            "a snowstorm",
            "a thick fog",
            "a windy day",
            "hail",
            "an overcast sky",
            "a calm and pleasant day"
        ];

        // Choose a random weather condition
        const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];

        // Create a message to all players describing the new weather
        const messageContent = `Wild Magic Surge: The weather suddenly changes to ${randomWeather}.`;

        // Send the message to all players
        ChatMessage.create({
            content: messageContent
        });
    },
    bangStun: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Calculate the range for finding creatures (60 feet)
        const range = 60 * canvas.grid.size;

        // Find all tokens within 60 feet of the caster
        const tokensWithinRange = canvas.tokens.placeables.filter(token => {
            const distance = Math.hypot(token.x - casterToken.x, token.y - casterToken.y);
            return distance <= range;
        });

        // Roll 1d4 to determine the duration in rounds
        const durationRoll = new Roll("1d4").roll();
        durationRoll.toMessage();
        const duration = durationRoll.total;

        // Apply stunned effect to each creature within range
        for (let token of tokensWithinRange) {
            // Create an Active Effect to represent the stunned condition
            const effectData = {
                label: "Stunned",
                icon: "icons/svg/paralysis.svg", // Use an appropriate icon
                changes: [
                    {
                        key: "data.attributes.hp.stunned",
                        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                        value: true
                    }
                ],
                origin: actor.uuid,
                duration: {
                    rounds: duration,
                },
                flags: {
                    core: {
                        statusId: "stunned"
                    }
                }
            };

            await token.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

            // Optionally, play a sound for each creature
            AudioHelper.play({ src: "path/to/bang.mp3", volume: 1.0, autoplay: true, loop: false });
        }

        // Play an animation using sequencer and jb2a to show the deafening bang effect
        new Sequence()
            .effect()
            .file("jb2a.explosion.08.1200.dark_orange") // Path to a suitable JB2A animation for the bang effect
            .atLocation(casterToken)
            .scale(1) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: A deafening bang affects everyone within 60 feet. All are stunned for ${duration} rounds.`
        });
    },
    voiceExchange: async (actor, actorToken, spellCast, target) => {
        // Ensure a target is selected
        if (!target) {
            ui.notifications.warn("No target selected.");
            return;
        }

        // Get the caster's and target's tokens
        const casterToken = canvas.tokens.get(actor.token.id);
        const targetToken = canvas.tokens.get(target.id);

        // Create an Active Effect to represent the voice exchange on the caster
        const casterEffectData = {
            label: "Voice Exchanged",
            icon: "icons/magic/control/fear-fright-monster-blue.webp", // Use an appropriate icon
            changes: [],
            origin: actor.uuid,
            duration: {
                seconds: 3600, // Lasts until remove curse is cast
            },
            flags: {
                core: {
                    statusId: "voiceExchanged"
                },
                dae: {
                    specialDuration: ["removeCurse"]
                }
            },
            transfer: true
        };

        // Create an Active Effect to represent the voice exchange on the target
        const targetEffectData = {
            label: "Voice Exchanged",
            icon: "icons/magic/control/fear-fright-monster-blue.webp", // Use an appropriate icon
            changes: [],
            origin: target.actor.uuid,
            duration: {
                seconds: 3600, // Lasts until remove curse is cast
            },
            flags: {
                core: {
                    statusId: "voiceExchanged"
                },
                dae: {
                    specialDuration: ["removeCurse"]
                }
            },
            transfer: true
        };

        // Apply the effects
        await actor.createEmbeddedDocuments("ActiveEffect", [casterEffectData]);
        await target.actor.createEmbeddedDocuments("ActiveEffect", [targetEffectData]);

        // Play an animation using sequencer and jb2a to show the voice exchange effect
        new Sequence()
            .effect()
            .file("jb2a.energy_strands.range.multiple.blue.01") // Path to a suitable JB2A animation for voice exchange
            .atLocation(casterToken)
            .stretchTo(targetToken)
            .scale(1) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: The caster and ${targetToken.name} exchange voices until a remove curse spell is cast.`
        });
    },
    gateSummon: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Define the chance for a creature to appear (50%)
        const creatureChance = Math.random() < 0.5;

        // Define possible extraplanar creatures (CR 5 and up)
        const extraplanarCreatures = [
            "Balor",
            "Pit Fiend",
            "Djinni",
            "Efreeti",
            "Nightmare",
            "Planetar",
            "Storm Giant",
            "Marilith",
            "Frost Salamander",
            "Githyanki Knight",
            "Invisible Stalker",
            "Yugoloth",
            "Horned Devil",
            "Fire Giant",
            "Gynosphinx"
        ];

        // Choose a random creature from the list
        const randomCreature = extraplanarCreatures[Math.floor(Math.random() * extraplanarCreatures.length)];

        // Define possible gate animations
        const gateAnimations = [
            "jb2a.portals.vertical.ring.blue",
            "jb2a.portals.vertical.ring.dark_blue",
            "jb2a.portals.vertical.ring.dark_green",
            "jb2a.portals.vertical.ring.dark_purple",
            "jb2a.portals.vertical.ring.dark_red",
            "jb2a.portals.vertical.ring.dark_red_yellow",
            "jb2a.portals.vertical.ring.dark_yellow",
            "jb2a.portals.vertical.ring.green",
            "jb2a.portals.vertical.ring.orange",
            "jb2a.portals.vertical.ring.red",
            "jb2a.portals.vertical.ring.purple",
            "jb2a.portals.vertical.ring.yellow",
        ];

        // Choose a random gate animation from the array
        const randomGateAnimation = gateAnimations[Math.floor(Math.random() * gateAnimations.length)];

        // Calculate the position in front of the caster and opposite the caster
        const direction = canvas.grid.getRay(casterToken.center, { x: casterToken.x + canvas.grid.size, y: casterToken.y }).angle;
        const position = {
            x: casterToken.x + Math.cos(direction) * canvas.grid.size,
            y: casterToken.y + Math.sin(direction) * canvas.grid.size
        };
        const oppositePosition = {
            x: casterToken.x - Math.cos(direction) * canvas.grid.size,
            y: casterToken.y - Math.sin(direction) * canvas.grid.size
        };

        // Play the selected gate animation using sequencer and jb2a
        new Sequence()
            .effect()
            .file(randomGateAnimation) // Use the randomly selected gate animation
            .atLocation(position)
            .scale(1) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .duration(600000) // 10 minutes in milliseconds
            .persist() // Make the animation last for the duration
            .play();

        // If the chance succeeds, use Warpgate to summon the random extraplanar creature
        if (creatureChance) {
            const pack = game.packs.find(p => p.documentName === "Actor");
            const index = await pack.getIndex();
            const entry = index.find(e => e.name === randomCreature);
            const document = await pack.getDocument(entry._id);
            const summonData = document.toObject();
            
            await warpgate.spawn(summonData, {
                token: { x: oppositePosition.x, y: oppositePosition.y }
            });

            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: `Wild Magic Surge: A portal appears in front of the caster, summoning a ${randomCreature} on the other side.`
            });
        } else {
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: "Wild Magic Surge: A portal appears in front of the caster, but nothing comes through."
            });
        }
    },
    shriek: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Define the path to the shrieking sound file
        const shriekSoundPath = "path/to/shriek.mp3"; // Replace with the actual path to the shrieking sound file

        // Play the shrieking sound
        AudioHelper.play({ src: shriekSoundPath, volume: 1.0, autoplay: true, loop: false });

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: The spell casts normally, but a shrieking sound is heard."
        });

        // Let the original spell cast normally
        // No need to modify the spellCast or prevent its effect
    },
    reduceByHalf: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Define a function to reduce numerical properties by 50%
        const reduceByHalf = (value) => Math.floor(value * 0.5);

        // Prevent the original spell from taking effect
        Hooks.once("midi-qol.preItemRoll", workflow => {
            if (workflow.item.id === spellCast.id) {
                workflow.targets = new Set(); // Clear targets to prevent the spell from taking effect
            }
        });

        // Modify the spell's data to reduce its effectiveness
        const modifiedSpellData = duplicate(spellCast.data);
        if (modifiedSpellData.data.range.value) {
            modifiedSpellData.data.range.value = reduceByHalf(modifiedSpellData.data.range.value);
        }
        if (modifiedSpellData.data.duration.value) {
            modifiedSpellData.data.duration.value = reduceByHalf(modifiedSpellData.data.duration.value);
        }
        if (modifiedSpellData.data.target.value) {
            modifiedSpellData.data.target.value = reduceByHalf(modifiedSpellData.data.target.value);
        }
        if (modifiedSpellData.data.damage.parts.length > 0) {
            modifiedSpellData.data.damage.parts = modifiedSpellData.data.damage.parts.map(part => {
                const [formula, type] = part;
                const reducedFormula = formula.replace(/\d+/g, match => reduceByHalf(parseInt(match)));
                return [reducedFormula, type];
            });
        }

        // Play an animation using sequencer and jb2a to show the spell being weakened
        new Sequence()
            .effect()
            .file("jb2a.energy_strands.overlay.dark_purple") // Path to a suitable JB2A animation for spell weakening
            .atLocation(casterToken)
            .scale(1) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: The spell's effectiveness is reduced by 50%."
        });

        // Cast the modified spell
        const newSpell = new CONFIG.Item.documentClass(modifiedSpellData, { parent: actor });
        const options = { showFullCard: false, createMeasuredTemplate: false, configureDialog: false };
        await MidiQOL.completeItemUse(newSpell, {}, options);
    },
    reverseAll: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Prevent the original spell from taking effect
        Hooks.once("midi-qol.preItemRoll", workflow => {
            if (workflow.item.id === spellCast.id) {
                workflow.targets = new Set(); // Clear targets to prevent the spell from taking effect
            }
        });

        // Modify the spell's data to reverse its effects
        const modifiedSpellData = duplicate(spellCast.data);

        // Reverse damage to healing and vice versa
        if (modifiedSpellData.data.damage.parts.length > 0) {
            modifiedSpellData.data.damage.parts = modifiedSpellData.data.damage.parts.map(part => {
                const [formula, type] = part;
                const newType = type === "healing" ? "damage" : "healing";
                return [formula, newType];
            });
        }

        // Reverse buffs to debuffs
        const reverseBuff = (change) => {
            if (change.key.includes("ac") || change.key.includes("hp") || change.key.includes("ability")) {
                return { ...change, value: `-${change.value}` };
            }
            return change;
        };

        modifiedSpellData.data.activeEffects = modifiedSpellData.data.activeEffects.map(effect => {
            effect.changes = effect.changes.map(reverseBuff);
            return effect;
        });

        // Play an animation using sequencer and jb2a to show the spell being reversed
        new Sequence()
            .effect()
            .file("jb2a.energy_strands.in.purple") // Path to a suitable JB2A animation for spell reversing
            .atLocation(casterToken)
            .scale(1) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: "Wild Magic Surge: The spell's effects are reversed."
        });

        // Cast the modified spell
        const newSpell = new CONFIG.Item.documentClass(modifiedSpellData, { parent: actor });
        const options = { showFullCard: false, createMeasuredTemplate: false, configureDialog: false };
        await MidiQOL.completeItemUse(newSpell, {}, options);
    },
    spellToElemental: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token and the target's token
        const casterToken = canvas.tokens.get(actor.token.id);
        const targetToken = canvas.tokens.get(target.id);

        // Prevent the original spell from taking effect
        Hooks.once("midi-qol.preItemRoll", workflow => {
            if (workflow.item.id === spellCast.id) {
                workflow.targets = new Set(); // Clear targets to prevent the spell from taking effect
            }
        });

        // Roll 1d4 to determine the duration in rounds
        const durationRoll = new Roll("1d4").roll();
        durationRoll.toMessage();
        const duration = durationRoll.total;

        // Define possible elementals
        const elementals = [
            "Air Elemental",
            "Earth Elemental",
            "Fire Elemental",
            "Water Elemental"
        ];

        // Choose a random elemental from the list
        const randomElemental = elementals[Math.floor(Math.random() * elementals.length)];

        // Calculate the position between the caster and the target
        const middlePosition = {
            x: (casterToken.x + targetToken.x) / 2,
            y: (casterToken.y + targetToken.y) / 2
        };

        // Use Warpgate to summon the random elemental at the middle position
        const summonedElemental = await warpgate.spawn(randomElemental, {
            token: { x: middlePosition.x, y: middlePosition.y },
            actor: { name: randomElemental, duration: duration }
        });

        // Add the summoned elemental to combat and roll initiative
        if (game.combat) {
            await game.combat.createEmbeddedDocument("Combatant", {
                tokenId: summonedElemental[0].id,
                actorId: summonedElemental[0].actor.id
            });
            await game.combat.rollInitiative([summonedElemental[0].id]);
        }

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: A ${randomElemental} appears between the caster and the target for ${duration} rounds.`
        });

        // Define a function to handle the elemental's behavior each round
        const handleElementalTurn = async () => {
            const elementalToken = canvas.tokens.get(summonedElemental[0].id);
            const targets = canvas.tokens.placeables.filter(t => {
                const distance = Math.hypot(t.x - elementalToken.x, t.y - elementalToken.y);
                return distance <= elementalToken.actor.data.data.attributes.movement.walk;
            });

            if (targets.length > 0) {
                const randomTarget = targets[Math.floor(Math.random() * targets.length)];
                const gmIds = game.users.filter(user => user.isGM).map(user => user.id);
                ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ actor }),
                    content: `The ${randomElemental} targets ${randomTarget.name}.`,
                    whisper: gmIds
                });
            }
        };

        // Hook to handle the elemental's turn
        Hooks.on("updateCombat", (combat, update) => {
            if (update.turn !== undefined && combat.combatants[update.turn].tokenId === summonedElemental[0].id) {
                handleElementalTurn();
            }
        });

        // Hook to handle the elemental's physical attacks
        Hooks.on("midi-qol.postAttackRoll", async (workflow) => {
            if (workflow.actor.id === summonedElemental[0].actor.id && workflow.item.data.data.actionType === "mwak") {
                if (workflow.hitTargets.size > 0) {
                    const hitTarget = [...workflow.hitTargets][0];
                    const newSpell = new CONFIG.Item.documentClass(duplicate(spellCast.data), { parent: actor });
                    const options = { showFullCard: false, createMeasuredTemplate: false, configureDialog: false };
                    await MidiQOL.completeItemUse(newSpell, {}, { target: [hitTarget] });
                    ChatMessage.create({
                        speaker: ChatMessage.getSpeaker({ actor }),
                        content: `Wild Magic Surge: The ${randomElemental} successfully hits ${hitTarget.name} with a physical attack. The original spell is cast on them.`
                    });
                }
            }
        });

        // Clean up hooks after the elemental's duration
        setTimeout(() => {
            Hooks.off("updateCombat", handleElementalTurn);
            Hooks.off("midi-qol.postAttackRoll", handleElementalTurn);
        }, duration * CONFIG.time.roundTime * 1000); // Convert duration to milliseconds
    },
    weaponGlow: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Roll 1d4 to determine the duration in rounds
        const durationRoll = new Roll("1d4").roll();
        durationRoll.toMessage();
        const duration = durationRoll.total;

        // Calculate the range for finding weapons (60 feet)
        const range = 60 * canvas.grid.size;

        // Find all tokens within 60 feet of the caster
        const tokensWithinRange = canvas.tokens.placeables.filter(token => {
            const distance = Math.hypot(token.x - casterToken.x, token.y - casterToken.y);
            return distance <= range;
        });

        // Collect all weapons within range
        let weapons = [];
        for (let token of tokensWithinRange) {
            let items = token.actor.items.filter(item => item.type === "weapon");
            weapons.push(...items);
        }

        // Apply glow effect to each weapon
        for (let weapon of weapons) {
            const existingEffect = weapon.actor.effects.find(effect => effect.data.label === "Glowing");

            if (existingEffect) continue; // Skip if the token already has a glow effect

            // Create an Active Effect to represent the glow effect
            const effectData = {
                label: "Glowing",
                icon: "icons/magic/light/orb-lightning-blue.webp", // Use an appropriate icon
                changes: [],
                origin: actor.uuid,
                duration: {
                    rounds: duration,
                },
                flags: {
                    core: {
                        statusId: "glowing"
                    }
                }
            };

            await weapon.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

            // Play an animation using sequencer and jb2a to show the weapons glowing
            new Sequence()
                .effect()
                .file("jb2a.detect_magic.circle.yellow") // Path to a suitable JB2A animation for glowing effect
                .atLocation(weapon.actor.token)
                .scale(0.5) // Adjust scale as needed
                .fadeIn(500)
                .fadeOut(500)
                .duration(duration * CONFIG.time.roundTime * 1000) // Duration in milliseconds
                .play();
        }

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: All weapons within 60 feet of the caster glow for ${duration} rounds.`
        });

        // Clean up hooks after the duration
        setTimeout(async () => {
            for (let weapon of weapons) {
                const effects = weapon.actor.effects.filter(effect => effect.data.label === "Glowing");
                for (let effect of effects) {
                    await weapon.actor.deleteEmbeddedDocuments("ActiveEffect", [effect.id]);
                }
            }
        }, duration * CONFIG.time.roundTime * 1000); // Convert duration to milliseconds
    },
    removeSavingThrow: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Check if the original spell requires a saving throw
        const requiresSavingThrow = spellCast.data.data.save.dc ? true : false;

        if (requiresSavingThrow) {
            // Prevent the original spell from taking effect
            Hooks.once("midi-qol.preItemRoll", workflow => {
                if (workflow.item.id === spellCast.id) {
                    workflow.targets = new Set(); // Clear targets to prevent the original spell from taking effect
                }
            });

            // Modify the spell's data to remove the saving throw
            const modifiedSpellData = duplicate(spellCast.data);
            delete modifiedSpellData.data.save;

            // Create a chat message to indicate the wild magic effect
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: "Wild Magic Surge: The spell is modified to not allow for a saving throw."
            });

            // Cast the modified spell
            const newSpell = new CONFIG.Item.documentClass(modifiedSpellData, { parent: actor });
            const options = { showFullCard: false, createMeasuredTemplate: false, configureDialog: false };
            await MidiQOL.completeItemUse(newSpell, {}, options);
           
        } else {
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: "Wild Magic Surge: The spell does not require a saving throw and is cast normally."
            });

            // Cast the spell as normal if it does not require a saving throw
            const options = { showFullCard: false, createMeasuredTemplate: false, configureDialog: false };
            await MidiQOL.completeItemUse(spellCast, {}, options);
        }
    },
    delayCast: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Roll 1d4 to determine the delay in rounds
        const delayRoll = new Roll("1d4").roll();
        delayRoll.toMessage();
        const delay = delayRoll.total;

        // Prevent the original spell from taking effect immediately
        Hooks.once("midi-qol.preItemRoll", workflow => {
            if (workflow.item.id === spellCast.id) {
                workflow.targets = new Set(); // Clear targets to prevent the original spell from taking effect
            }
        });

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: The spell will be cast after a delay of ${delay} rounds.`
        });

        // Function to cast the delayed spell
        const castDelayedSpell = async () => {
            const newSpell = new CONFIG.Item.documentClass(duplicate(spellCast.data), { parent: actor });
            const options = { showFullCard: false, createMeasuredTemplate: false, configureDialog: false };
            await MidiQOL.completeItemUse(newSpell, {}, options);
        };

        // Schedule the casting of the delayed spell
        Hooks.once("updateCombat", (combat, update) => {
            if (update.round === combat.round + delay) {
                castDelayedSpell();
            }
        });
    },
    glowMagic: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Roll 2d8 to determine the duration in days
        const durationRoll = new Roll("2d8").roll();
        durationRoll.toMessage();
        const duration = durationRoll.total;

        // Calculate the range for finding actors (60 feet)
        const range = 60 * canvas.grid.size;

        // Find all tokens within 60 feet of the caster
        const tokensWithinRange = canvas.tokens.placeables.filter(token => {
            const distance = Math.hypot(token.x - casterToken.x, token.y - casterToken.y);
            return distance <= range;
        });

        // Function to apply the glow effect to magical items
        const applyGlowEffect = async (item) => {
            const existingEffect = item.effects.find(effect => effect.data.label === "Glowing");

            if (existingEffect) return; // Skip if the item already has a glow effect

            // Create an Active Effect to represent the glow effect
            const effectData = {
                label: "Glowing",
                icon: "icons/magic/light/orb-lightning-blue.webp", // Use an appropriate icon
                changes: [],
                origin: actor.uuid,
                duration: {
                    seconds: duration * 86400, // Duration in seconds (1 day = 86400 seconds)
                },
                flags: {
                    core: {
                        statusId: "glowing"
                    }
                }
            };

            await item.createEmbeddedDocuments("ActiveEffect", [effectData]);

            // Play an animation using sequencer and jb2a to show the items glowing
            new Sequence()
                .effect()
                .file("jb2a.detect_magic.circle.yellow") // Path to a suitable JB2A animation for glowing effect
                .atLocation(item.parent.token)
                .scale(0.5) // Adjust scale as needed
                .fadeIn(500)
                .fadeOut(500)
                .duration(duration * CONFIG.time.dayTime * 1000) // Duration in milliseconds
                .play();
        };

        // Apply glow effect to all magical items within range
        for (let token of tokensWithinRange) {
            let items = token.actor.items.filter(item => item.data.data.rarity);
            for (let item of items) {
                await applyGlowEffect(item);
            }
        }

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: All magical items within 60 feet of the caster glow for ${duration} days.`
        });

        // Hook ID for tracking
        let hookId;

        // Function to re-apply the glow effect when a new token is created
        const handleTokenCreation = async (scene, tokenData) => {
            const token = canvas.tokens.get(tokenData._id);
            if (tokensWithinRange.some(t => t.actor.id === token.actor.id)) {
                let items = token.actor.items.filter(item => item.data.data.rarity);
                for (let item of items) {
                    await applyGlowEffect(item);
                }
            }
        };

        // Hook to re-apply the glow effect
        hookId = Hooks.on("createToken", handleTokenCreation);

        // Clean up hooks after the duration
        setTimeout(() => {
            Hooks.off("createToken", hookId);
        }, duration * 86400 * 1000); // Convert duration to milliseconds
    },
    personalitySwap: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token and the target's token
        const casterToken = canvas.tokens.get(actor.token.id);
        const targetToken = canvas.tokens.get(target.id);

        // Roll 2d10 to determine the duration in rounds
        const durationRoll = new Roll("2d10").roll();
        durationRoll.toMessage();
        const duration = durationRoll.total;

        // Function to apply the personality switch effect
        const applyPersonalitySwitchEffect = async (sourceActor, targetActor) => {
            // Create an Active Effect to represent the personality switch
            const effectData = {
                label: "Personality Switch",
                icon: "icons/magic/mind/control/dominate-creature-blue.webp", // Use an appropriate icon
                changes: [],
                origin: sourceActor.uuid,
                duration: {
                    rounds: duration,
                },
                flags: {
                    core: {
                        statusId: "personalitySwitch"
                    }
                }
            };

            // Apply the effect to both actors
            await sourceActor.createEmbeddedDocuments("ActiveEffect", [effectData]);
            await targetActor.createEmbeddedDocuments("ActiveEffect", [effectData]);

            // Display a message indicating the personality switch
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: sourceActor }),
                content: `${sourceActor.name} and ${targetActor.name} have switched personalities for ${duration} rounds!`
            });

            // Optionally, play an animation using sequencer and jb2a to show the personality switch
            new Sequence()
                .effect()
                .file("jb2a.energy_strands.range.multiple.orange.01") // Path to a suitable JB2A animation for personality switch
                .atLocation(casterToken)
                .stretchTo(targetToken)
                .scale(1) // Adjust scale as needed
                .fadeIn(500)
                .fadeOut(500)
                .play();
        };

        // Apply the personality switch effect to the caster and the target
        await applyPersonalitySwitchEffect(actor, target.actor);

        // Clean up the effects after the duration
        setTimeout(async () => {
            const casterEffects = actor.effects.filter(effect => effect.data.label === "Personality Switch");
            const targetEffects = target.actor.effects.filter(effect => effect.data.label === "Personality Switch");

            for (let effect of casterEffects) {
                await actor.deleteEmbeddedDocuments("ActiveEffect", [effect.id]);
            }
            for (let effect of targetEffects) {
                await target.actor.deleteEmbeddedDocuments("ActiveEffect", [effect.id]);
            }

            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: `${actor.name} and ${target.actor.name} have reverted to their original personalities.`
            });
        }, duration * CONFIG.time.roundTime * 1000); // Convert duration to milliseconds
    },
    targetSizeReduce: async (actor, actorToken, spellCast, target) => {
        // Get the target's actor
        const targetActor = target.actor;

        // Define size categories in order
        const sizeCategories = ["tiny", "small", "medium", "large", "huge", "gargantuan"];

        // Get the current size of the target
        const currentSize = targetActor.data.data.traits.size;

        // Find the index of the current size in the size categories array
        const currentIndex = sizeCategories.indexOf(currentSize);

        // If the target is not the smallest size, reduce the size by one category
        if (currentIndex > 0) {
            const newSize = sizeCategories[currentIndex - 1];
            await targetActor.update({ "data.traits.size": newSize });

            // Halve the target's HP
            const newHP = Math.floor(targetActor.data.data.attributes.hp.max / 2);
            await targetActor.update({ "data.attributes.hp.max": newHP, "data.attributes.hp.value": newHP });

            // Create a chat message to indicate the wild magic effect
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: `Wild Magic Surge: ${targetActor.name}'s size is reduced to ${newSize} and their HP is halved.`
            });

            // Optionally, play an animation using sequencer and jb2a to show the size reduction
            new Sequence()
                .effect()
                .file("jb2a.template_circle.vortex.intro.green") // Path to a suitable JB2A animation for size reduction
                .atLocation(target)
                .scale(1) // Adjust scale as needed
                .fadeIn(500)
                .fadeOut(500)
                .play();
        } else {
            // Create a chat message indicating the target is already the smallest size
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: `Wild Magic Surge: ${targetActor.name} is already the smallest size and cannot be reduced further.`
            });
        }
    },
    addLightningBolt: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token and the target's token
        const casterToken = canvas.tokens.get(actor.token.id);
        const targetToken = canvas.tokens.get(target.id);

        // Define the Lightning Bolt spell data (you may need to adjust the spell ID to match your compendium)
        const spellName = "Lightning Bolt";

        // Search for the Darkness spell in the compendium
        const pack = game.packs.find(p => p.metadata.label === "Spells");
        const index = await pack.getIndex();
        const entry = index.find(e => e.name === spellName);
        if (!entry) {
            ui.notifications.error(`${spellName} spell not found in compendium.`);
            return;
        }

        // Load the Darkness spell from the compendium
        const lightningBoltSpell = await pack.getDocument(entry._id);   

        // Create a new instance of the Lightning Bolt spell
        const newSpell = new CONFIG.Item.documentClass(lightningBoltSpell.toObject(), { parent: actor });

        // Cast the Lightning Bolt spell at the target
        const options = { showFullCard: false, createMeasuredTemplate: false, configureDialog: false };
        await MidiQOL.completeItemUse(newSpell, {}, { target: [targetToken] });

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: A Lightning Bolt spell is cast at ${targetToken.name} in addition to the original spell.`
        });

        // Cast the original spell as well
        await MidiQOL.completeItemUse(spellCast, {}, { target: [targetToken] });
    },
    enlargeTarget: async (actor, actorToken, spellCast, target) => {
        // Get the target's actor
        const targetActor = target.actor;

        // Define size categories in order
        const sizeCategories = ["tiny", "small", "medium", "large", "huge", "gargantuan"];

        // Get the current size of the target
        const currentSize = targetActor.data.data.traits.size;

        // Find the index of the current size in the size categories array
        const currentIndex = sizeCategories.indexOf(currentSize);

        // If the target is not the largest size, enlarge the size by one category
        if (currentIndex < sizeCategories.length - 1) {
            const newSize = sizeCategories[currentIndex + 1];
            await targetActor.update({ "data.traits.size": newSize });

            // Increase the target's HP to simulate the effect of enlarging
            const newHP = targetActor.data.data.attributes.hp.max + 10; // Example: increase max HP by 10 (adjust as needed)
            await targetActor.update({ "data.attributes.hp.max": newHP, "data.attributes.hp.value": newHP });

            // Create a chat message to indicate the wild magic effect
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: `Wild Magic Surge: ${targetActor.name} is enlarged to ${newSize} size.`
            });

            // Optionally, play an animation using sequencer and jb2a to show the enlargement
            new Sequence()
                .effect()
                .file("jb2a.particles.outward.greenyellow.01.01") // Path to a suitable JB2A animation for enlargement
                .atLocation(target)
                .scale(1) // Adjust scale as needed
                .fadeIn(500)
                .fadeOut(500)
                .play();
        } else {
            // Create a chat message indicating the target is already the largest size
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: `Wild Magic Surge: ${targetActor.name} is already the largest size and cannot be enlarged further.`
            });
        }

        // Cast the original spell as well
        await MidiQOL.completeItemUse(spellCast, {}, { target: [target] });
    },
    darkness: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token and the target's token
        const casterToken = canvas.tokens.get(actor.token.id);
        const targetToken = canvas.tokens.get(target.id);

        // Define the name of the Darkness spell
        const spellName = "Darkness";

        // Search for the Darkness spell in the compendium
        const pack = game.packs.find(p => p.metadata.label === "Spells");
        const index = await pack.getIndex();
        const entry = index.find(e => e.name === spellName);
        if (!entry) {
            ui.notifications.error(`${spellName} spell not found in compendium.`);
            return;
        }

        // Load the Darkness spell from the compendium
        const darknessSpell = await pack.getDocument(entry._id);

        // Create a new instance of the Darkness spell
        const newSpell = new CONFIG.Item.documentClass(darknessSpell.toObject(), { parent: actor });

        // Cast the Darkness spell on the target
        const options = { showFullCard: false, createMeasuredTemplate: false, configureDialog: false };
        await MidiQOL.completeItemUse(newSpell, {}, { target: [targetToken] });

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: Darkness is cast on ${targetToken.name} in addition to the original spell.`
        });

        // Cast the original spell as well
        await MidiQOL.completeItemUse(spellCast, {}, { target: [targetToken] });
    },
    plantGrowth: async (actor, actorToken, spellCast, target) => {
        // Get the target's token
        const targetToken = canvas.tokens.get(target.id);

        // Define the radius for Plant Growth
        const radius = 30;

        // Play an animation using sequencer and jb2a to show the plant growth effect
        new Sequence()
            .effect()
            .file("jb2a.plant_growth.02.round.4x4.complete") // Path to a suitable JB2A animation for plant growth
            .atLocation(targetToken)
            .scale(radius / 5) // Adjust scale as needed
            .play();
        
        new Sequence()
            .effect()
            .file("jb2a.plant_growth.02.round.4x4.loop.greenred") // Path to a suitable JB2A animation for plant growth
            .atLocation(targetToken)
            .scale(radius / 5) // Adjust scale as needed
            .delay(4000)
            .persist()
            .play();

        


        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: Plants grow around ${targetToken.name} in a 30 ft radius.`
        });

        // Cast the original spell as well
        await MidiQOL.completeItemUse(spellCast, {}, { target: [targetToken] });
    },
    destroyMatter: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Define the radius and weight to be destroyed
        const radius = 10 * canvas.grid.size;
        const weightToDestroy = 1000;
        const craterImagePath = "path/to/crater/image.png"; // Define the path to your crater image

        // Calculate the range for finding items (10 feet)
        const tokensWithinRange = canvas.tokens.placeables.filter(token => {
            const distance = Math.hypot(token.x - casterToken.x, token.y - casterToken.y);
            return distance <= radius;
        });

        // Filter out the caster's items
        const itemsToDestroy = [];
        let totalWeight = 0;

        for (let token of tokensWithinRange) {
            if (token.actor.id !== actor.id) {
                let items = token.actor.items.filter(item => item.data.data.weight);
                for (let item of items) {
                    if (totalWeight + item.data.data.weight <= weightToDestroy) {
                        itemsToDestroy.push(item);
                        totalWeight += item.data.data.weight;
                    } else {
                        // Calculate the remaining weight to be destroyed
                        const remainingWeight = weightToDestroy - totalWeight;
                        totalWeight += remainingWeight;
                        break;
                    }
                }
            }
        }

        // Destroy the items
        for (let item of itemsToDestroy) {
            await item.delete();
        }

        // If there is still weight left to be destroyed, create a crater
        const remainingWeight = weightToDestroy - totalWeight;
        if (remainingWeight > 0) {
            const craterSize = Math.sqrt(remainingWeight) * 0.1; // Adjust crater size based on remaining weight

            // Create a tile for the crater
            const tileData = {
                img: craterImagePath,
                x: casterToken.x - (craterSize / 2),
                y: casterToken.y - (craterSize / 2),
                width: craterSize,
                height: craterSize,
                z: 0,
                rotation: 0,
                alpha: 1,
                hidden: false,
                locked: false
            };

            await canvas.scene.createEmbeddedDocuments("Tile", [tileData]);

            // Play an animation using sequencer and jb2a to show the crater creation
            new Sequence()
                .effect()
                .file("jb2a.ground_cracks.01.orange") // Path to a suitable JB2A animation for crater creation
                .atLocation(casterToken)
                .scale(craterSize / 5) // Adjust scale as needed
                .persist()
                .play();
        }

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: 1000 pounds of non-living matter in a 10' radius around the caster is destroyed. A crater forms at the caster's feet.`
        });

        // Cast the original spell as well
        await MidiQOL.completeItemUse(spellCast, {}, { target: [target] });
    },
    castFireball: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token and the target's token
        const casterToken = canvas.tokens.get(actor.token.id);
        const targetToken = canvas.tokens.get(target.id);

        // Define the Fireball spell data (you may need to adjust the spell ID to match your compendium)
        const spellName = "Fireball";

        // Search for the Fireball spell in the compendium
        const pack = game.packs.find(p => p.metadata.label === "Spells");
        const index = await pack.getIndex();
        const entry = index.find(e => e.name === spellName);
        if (!entry) {
            ui.notifications.error(`${spellName} spell not found in compendium.`);
            return;
        }

        // Load the Fireball spell from the compendium
        const fireballSpell = await pack.getDocument(entry._id);


        // Create a new instance of the Fireball spell
        const newSpell = new CONFIG.Item.documentClass(fireballSpell.toObject(), { parent: actor });

        // Cast the Fireball spell at the target
        const options = { showFullCard: false, createMeasuredTemplate: false, configureDialog: false };
        await MidiQOL.completeItemUse(newSpell, {}, { target: [targetToken] });

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: A Fireball spell is cast at ${targetToken.name} in addition to the original spell.`
        });

        // Cast the original spell as well
        await MidiQOL.completeItemUse(spellCast, {}, { target: [targetToken] });
    },
    targetPetrified: async (actor, actorToken, spellCast, target) => {
        // Get the target's actor
        const targetActor = target.actor;

        // Define the Petrified status effect data
        const petrifiedEffectData = {
            label: "Petrified",
            icon: "icons/magic/control/stone-petrify-gray.webp", // Use an appropriate icon for the petrified status
            changes: [
                { key: "data.attributes.hp.value", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: 0 }, // Example: Set HP to 0 (adjust as needed)
                { key: "data.attributes.movement.all", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: 0 }, // Prevent movement
                { key: "data.attributes.ac.value", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: 20 }, // Example: Increase AC (adjust as needed)
            ],
            origin: actor.uuid,
            disabled: false,
            duration: {
                rounds: 10, // Example: Set duration to 10 rounds (adjust as needed)
            },
            flags: {
                core: {
                    statusId: "petrified"
                }
            }
        };

        // Apply the Petrified status effect to the target
        await targetActor.createEmbeddedDocuments("ActiveEffect", [petrifiedEffectData]);

        // Play an animation using sequencer and jb2a to show the petrification effect
        new Sequence()
            .effect()
            .file("jb2a.energy_strands.complete.grey.01") // Path to a suitable JB2A animation for petrification
            .atLocation(target)
            .scale(1) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: ${targetActor.name} is petrified.`
        });

        // Cast the original spell as well
        await MidiQOL.completeItemUse(spellCast, {}, { target: [target] });
    },
    preventSpellSlotConsumption: async (actor, actorToken, spellCast, target) => {
        // Get the spell level of the original spell
        const spellLevel = spellCast.data.data.level;

        // Temporarily increase the spell slots available for the spell's level
        const spellSlots = actor.data.data.spells[`spell${spellLevel}`].value;
        await actor.update({ [`data.spells.spell${spellLevel}.value`]: spellSlots + 1 });

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: The original spell is cast without consuming a spell slot.`
        });

        // Cast the original spell
        await MidiQOL.completeItemUse(spellCast, {}, { target: [target] });

        // After casting the spell, revert the spell slots to their original value
        await actor.update({ [`data.spells.spell${spellLevel}.value`]: spellSlots });
    },
    healTenFeet: async (actor, actorToken, spellCast, target) => {
        // Get the caster's token
        const casterToken = canvas.tokens.get(actor.token.id);

        // Define the radius and the Heal spell name
        const radius = 10 * canvas.grid.size;
        const spellName = "Heal";

        // Search for the Heal spell in the compendium
        const pack = game.packs.find(p => p.metadata.label === "Spells");
        const index = await pack.getIndex();
        const entry = index.find(e => e.name === spellName);
        if (!entry) {
            ui.notifications.error(`${spellName} spell not found in compendium.`);
            return;
        }

        // Load the Heal spell from the compendium
        const healSpell = await pack.getDocument(entry._id);

        // Find all tokens within 10 feet of the caster
        const tokensWithinRange = canvas.tokens.placeables.filter(token => {
            const distance = Math.hypot(token.x - casterToken.x, token.y - casterToken.y);
            return distance <= radius;
        });

        // Play an animation using sequencer and jb2a to show the heal effect
        new Sequence()
            .effect()
            .file("jb2a.healing_generic.burst.greenorange") // Path to a suitable JB2A animation for healing
            .atLocation(casterToken)
            .radius(radius / 2) // Adjust radius as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        // Create a new instance of the Heal spell
        const newSpell = new CONFIG.Item.documentClass(healSpell.toObject(), { parent: actor });

        // Cast the Heal spell on each token within range
        for (let token of tokensWithinRange) {
            await MidiQOL.completeItemUse(newSpell, {}, { target: [token] });
        }

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: Each creature in a 10-foot radius centered on the caster receives a "Heal" spell.`
        });

        // Cast the original spell as well
        await MidiQOL.completeItemUse(spellCast, {}, { target: [target] });
    },
    dizzy: async (actor, actorToken, spellCast, target) => {
        // Get the target's actor
        const targetActor = target.actor;

        // Define the Dizzy status effect data
        const dizzyEffectData = {
            label: "Dizzy",
            icon: "icons/magic/perception/eye-web-gray.webp", // Use an appropriate icon for the dizzy status
            changes: [
                { key: "data.attributes.ac.value", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: -4 }, // -4 penalty to AC
                { key: "data.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 }, // Halve movement speed
            ],
            origin: actor.uuid,
            disabled: false,
            duration: {
                rounds: 10, // Example: Set duration to 10 rounds (adjust as needed)
            },
            flags: {
                core: {
                    statusId: "dizzy"
                }
            }
        };

        // Apply the Dizzy status effect to the target
        await targetActor.createEmbeddedDocuments("ActiveEffect", [dizzyEffectData]);

        // Create a macro to prevent the target from casting spells
        const preventSpellsMacro = async () => {
            if (targetActor.effects.some(effect => effect.data.label === "Dizzy")) {
                ui.notifications.warn(`${targetActor.name} is too dizzy to cast spells.`);
                return false;
            }
        };

        // Register the macro
        Hooks.on("preItemUse", preventSpellsMacro);

        // Play an animation using sequencer and jb2a to show the dizziness effect
        new Sequence()
            .effect()
            .file("jb2a.portals.horizontal.vortex.black") // Path to a suitable JB2A animation for dizziness
            .atLocation(target)
            .scale(1) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: ${targetActor.name} becomes dizzy (-4 AC, cannot cast spells, move at half speed).`
        });

        // Remove the effect and hook after the duration
        setTimeout(async () => {
            const effects = targetActor.effects.filter(effect => effect.data.label === "Dizzy");
            for (let effect of effects) {
                await targetActor.deleteEmbeddedDocuments("ActiveEffect", [effect.id]);
            }
            Hooks.off("preItemUse", preventSpellsMacro);
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: `${targetActor.name} is no longer dizzy.`
            });
        }, 10 * CONFIG.time.roundTime * 1000); // Adjust duration as needed

        // Cast the original spell as well
        await MidiQOL.completeItemUse(spellCast, {}, { target: [target] });
    },
    wallOfFireTarget: async (actor, actorToken, spellCast, target) => {
        // Get the target's token
        const targetToken = canvas.tokens.get(target.id);

        // Define the Wall of Fire spell data (you may need to adjust the spell ID to match your compendium)
        const spellName = "Wall of Fire";

        // Search for the Wall of Fire spell in the compendium
        const pack = game.packs.find(p => p.metadata.label === "Spells");
        const index = await pack.getIndex();
        const entry = index.find(e => e.name === spellName);
        if (!entry) {
            ui.notifications.error(`${spellName} spell not found in compendium.`);
            return;
        }

        // Load the Wall of Fire spell from the compendium
        const wallOfFireSpell = await pack.getDocument(entry._id);

        // Play an animation using sequencer and jb2a to show the wall of fire effect
        new Sequence()
            .effect()
            .file("jb2a.wall_of_fire.ring.yellow") // Path to a suitable JB2A animation for wall of fire
            .atLocation(targetToken)
            .name("wall-of-fire-target-animation")
            .scale(1) // Adjust scale as needed
            .persist() // Make the animation persist
            .play();

        // Create the Wall of Fire effect
        const templateData = {
            t: "circle",
            user: game.user.id,
            x: targetToken.x,
            y: targetToken.y,
            direction: 0,
            distance: 10, // Adjust distance as needed to form a ring around the target
            borderColor: "#FF4500",
            fillColor: "#FF4500",
            flags: {
                spellEffect: {
                    name: "Wall of Fire",
                    permanent: true
                }
            }
        };

        // Create the template on the canvas
        const template = await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [templateData]);

        // Function to handle damage when someone enters the wall of fire
        const handleMovement = async (token, update) => {
            const x = update.x !== undefined ? update.x : token.x;
            const y = update.y !== undefined ? update.y : token.y;
            const distance = Math.hypot(x - targetToken.x, y - targetToken.y);

            if (distance <= templateData.distance * canvas.grid.size) {
                const damageRoll = new Roll("5d8").roll();
                damageRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ token: targetToken }),
                    flavor: "Wall of Fire damage"
                });
                await new MidiQOL.DamageOnlyWorkflow(actor, token, damageRoll.total, "fire", [token], damageRoll, {
                    flavor: `Wild Magic Surge: Wall of Fire damage`,
                    itemCardId: "new"
                });
            }
        };

        // Register the hook to handle movement
        Hooks.on("updateToken", handleMovement);

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: A Wall of Fire circles ${targetToken.name}. Anyone stepping into the ring takes fire damage.`
        });

        // Clean up the effect and hook when the wall is removed
        const removeWall = async () => {
            await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [template[0]._id]);
            Sequencer.EffectManager.endEffects({ name: "wall-of-fire-target-animation" });
            Hooks.off("updateToken", handleMovement);
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: `The Wall of Fire around ${targetToken.name} has dissipated.`
            });
        };

        // Remove the wall after a specified duration (e.g., 1 minute)
        setTimeout(removeWall, 60 * 1000);

        // Cast the original spell as well
        await MidiQOL.completeItemUse(spellCast, {}, { target: [targetToken] });
    },
    levitateTarget: async (actor, actorToken, spellCast, target) => {
        // Get the target's token
        const targetToken = canvas.tokens.get(target.id);

        // Define the Levitate spell data (you may need to adjust the spell ID to match your compendium)
        const spellName = "Levitate";

        // Search for the Levitate spell in the compendium
        const pack = game.packs.find(p => p.metadata.label === "Spells");
        const index = await pack.getIndex();
        const entry = index.find(e => e.name === spellName);
        if (!entry) {
            ui.notifications.error(`${spellName} spell not found in compendium.`);
            return;
        }

        // Load the Levitate spell from the compendium
        const levitateSpell = await pack.getDocument(entry._id);

        // Roll 1d3 to determine the duration in turns
        const durationRoll = new Roll("1d3").roll();
        durationRoll.toMessage();
        const duration = durationRoll.total;

        // Define the Levitate status effect data
        const levitateEffectData = {
            label: "Levitate",
            icon: "icons/magic/air/air-wave-blue.webp", // Use an appropriate icon for the levitate status
            changes: [],
            origin: actor.uuid,
            disabled: false,
            duration: {
                turns: duration,
                startRound: game.combat ? game.combat.round : 0,
                startTurn: game.combat ? game.combat.turn : 0
            },
            flags: {
                core: {
                    statusId: "levitate"
                }
            }
        };

        // Apply the Levitate status effect to the target
        await target.actor.createEmbeddedDocuments("ActiveEffect", [levitateEffectData]);        

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: ${target.actor.name} is levitated for ${duration} turns.`
        });

        // Cast the original spell as well
        await MidiQOL.completeItemUse(spellCast, {}, { target: [targetToken] });
    },
    darknessOnTarget: async (actor, actorToken, spellCast, target) => {
        // Get the target's token
        const targetToken = canvas.tokens.get(target.id);

        // Define the Darkness spell data (you may need to adjust the spell ID to match your compendium)
        const spellName = "Darkness";

        // Search for the Darkness spell in the compendium
        const pack = game.packs.find(p => p.metadata.label === "Spells");
        const index = await pack.getIndex();
        const entry = index.find(e => e.name === spellName);
        if (!entry) {
            ui.notifications.error(`${spellName} spell not found in compendium.`);
            return;
        }

        // Load the Darkness spell from the compendium
        const darknessSpell = await pack.getDocument(entry._id);

        // Create a new instance of the Darkness spell
        const newSpell = new CONFIG.Item.documentClass(darknessSpell.toObject(), { parent: actor });

        // Cast the Darkness spell on the target
        const options = { showFullCard: false, createMeasuredTemplate: false, configureDialog: false };
        await MidiQOL.completeItemUse(newSpell, {}, { target: [targetToken] });

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: Darkness is cast on ${targetToken.name} in addition to the original spell.`
        });

        // Cast the original spell as well
        await MidiQOL.completeItemUse(spellCast, {}, { target: [targetToken] });
    },
    targetIsCharmed: async (actor, actorToken, spellCast, target) => {
        // Get the target's actor
        const targetActor = target.actor;

        // Define the Charmed status effect data
        const charmedEffectData = {
            label: "Charmed",
            icon: "icons/magic/control/mind-control-pink.webp", // Use an appropriate icon for the charmed status
            changes: [],
            origin: actor.uuid,
            disabled: false,
            duration: {
                rounds: 10, // Example: Set duration to 10 rounds (adjust as needed)
            },
            flags: {
                core: {
                    statusId: "charmed"
                }
            }
        };

        // Apply the Charmed status effect to the target
        await targetActor.createEmbeddedDocuments("ActiveEffect", [charmedEffectData]);

        // Play an animation using sequencer and jb2a to show the charmed effect
        new Sequence()
            .effect()
            .file("jb2a.divine_smite.caster.reversed.pink") // Path to a suitable JB2A animation for charming
            .atLocation(target)
            .scale(1) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: ${targetActor.name} is charmed in addition to the effects of the original spell.`
        });

        // Cast the original spell as well
        await MidiQOL.completeItemUse(spellCast, {}, { target: [target] });
    },
    consumeTargetSpellSlots: async (actor, actorToken, spellCast, target) => {
        // Get the target's actor
        const targetActor = target.actor;

        // Define a function to consume all spell slots
        const consumeAllSpellSlots = async (actor) => {
            const spellSlotKeys = Object.keys(actor.data.data.spells).filter(key => key.startsWith("spell"));

            let updates = {};
            spellSlotKeys.forEach(key => {
                updates[`data.spells.${key}.value`] = 0;
            });

            await actor.update(updates);

            // Create a chat message to indicate the spell slots are consumed
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: `${actor.name} has all spell slots consumed.`
            });
        };

        // Consume all spell slots of the target
        await consumeAllSpellSlots(targetActor);

        // Play an animation using sequencer and jb2a to show the spell slot consumption effect
        new Sequence()
            .effect()
            .file("jb2a.divine_smite.caster.dark_purple") // Path to a suitable JB2A animation for spell slot consumption
            .atLocation(target)
            .scale(1) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: All spell slots of ${targetActor.name} are consumed.`
        });

        // Cast the original spell as well
        await MidiQOL.completeItemUse(spellCast, {}, { target: [target] });
    },
    enlargeTargetFeet: async (actor, actorToken, spellCast, target) => {
        // Get the target's actor
        const targetActor = target.actor;

        // Define the Enlarged Feet status effect data
        const enlargedFeetEffectData = {
            label: "Enlarged Feet",
            icon: "icons/magic/control/size-change-grow-giant-green.webp", // Use an appropriate icon for the enlarged feet status
            changes: [
                { key: "data.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: 0.5 }, // Halve movement speed
                { key: "data.attributes.init.value", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: -4 } // -4 penalty to initiative rolls
            ],
            origin: actor.uuid,
            disabled: false,
            flags: {
                core: {
                    statusId: "enlargedFeet"
                },
                dae: {
                    specialDuration: ["Remove Curse"]
                }
            }
        };

        // Apply the Enlarged Feet status effect to the target
        await targetActor.createEmbeddedDocuments("ActiveEffect", [enlargedFeetEffectData]);

        // Play an animation using sequencer and jb2a to show the enlarged feet effect
        new Sequence()
            .effect()
            .file("jb2a.impact.001.dark_red") // Path to a suitable JB2A animation for the enlarged feet effect
            .atLocation(target)
            .scale(1) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: ${targetActor.name}'s feet enlarge, reducing movement to half of normal and adding -4 to initiative rolls until a Remove Curse spell is cast.`
        });

        // Cast the original spell as well
        await MidiQOL.completeItemUse(spellCast, {}, { target: [target] });
    },
    rustMonster: async (actor, actorToken, spellCast, target) => {
        // Get the target's token
        const targetToken = canvas.tokens.get(target.id);

        // Define the Rust Monster data (you may need to adjust the actor ID to match your compendium)
        const monsterName = "Rust Monster";

        // Search for the Rust Monster in the compendium
        const pack = game.packs.find(p => p.documentName === "Actor");
        const index = await pack.getIndex();
        const entry = index.find(e => e.name === monsterName);
        if (!entry) {
            ui.notifications.error(`${monsterName} not found in compendium.`);
            return;
        }

        // Load the Rust Monster from the compendium
        const rustMonster = await pack.getDocument(entry._id);

        // Create a new instance of the Rust Monster
        const newMonsterData = duplicate(rustMonster.data);
        newMonsterData.token.x = targetToken.x + canvas.grid.size;
        newMonsterData.token.y = targetToken.y;
        newMonsterData.token.disposition = -1; // Hostile disposition

        // Create the Rust Monster token on the canvas
        const createdMonster = await TokenDocument.create(newMonsterData.token, { parent: canvas.scene });

        // Play an animation using sequencer and jb2a to show the Rust Monster appearing
        new Sequence()
            .effect()
            .file("jb2a.portals.horizontal.vortex.red") // Path to a suitable JB2A animation for summoning
            .atLocation(createdMonster)
            .scale(1) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        // Check if the caster is in combat and add the Rust Monster to the combat encounter
        if (game.combat) {
            await game.combat.createCombatant({ tokenId: createdMonster.id });
            await game.combat.rollInitiative(createdMonster.id);
        }

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: A Rust Monster appears in front of ${targetToken.name}, hostile to everyone.`
        });

        // Cast the original spell as well
        await MidiQOL.completeItemUse(spellCast, {}, { target: [targetToken] });
    },
    polymorphTarget: async (actor, actorToken, spellCast, target) => {
        // Get the target's token
        const targetToken = canvas.tokens.get(target.id);

        // Define the Polymorph spell data (you may need to adjust the spell ID to match your compendium)
        const spellName = "Polymorph";

        // Search for the Polymorph spell in the compendium
        const pack = game.packs.find(p => p.metadata.label === "Spells");
        const index = await pack.getIndex();
        const entry = index.find(e => e.name === spellName);
        if (!entry) {
            ui.notifications.error(`${spellName} spell not found in compendium.`);
            return;
        }

        // Load the Polymorph spell from the compendium
        const polymorphSpell = await pack.getDocument(entry._id);

        // Get all actors from all compendiums
        const packs = game.packs.filter(p => p.documentName === "Actor");
        let allActors = [];
        for (const pack of packs) {
            const content = await pack.getDocuments();
            allActors = allActors.concat(content);
        }

        // Select a random actor for polymorph
        const randomActor = allActors[Math.floor(Math.random() * allActors.length)];

        // Play an animation using sequencer and jb2a to show the polymorph effect
        new Sequence()
            .effect()
            .file("jb2a.explosion.blueyellow") // Path to a suitable JB2A animation for polymorph
            .atLocation(targetToken)
            .scale(1) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        // Apply the Polymorph status effect to the target
        const polymorphEffectData = {
            label: "Polymorph",
            icon: "icons/magic/animal/wolf-paw-glow-blue.webp", // Use an appropriate icon for the polymorph status
            changes: [
                { key: "data.attributes.hp.value", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: randomActor.data.data.attributes.hp.max },
                { key: "data.attributes.ac.value", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: randomActor.data.data.attributes.ac.value },
                { key: "data.details.type", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: randomActor.data.data.details.type },
                { key: "data.abilities.str.value", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: randomActor.data.data.abilities.str.value },
                { key: "data.abilities.dex.value", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: randomActor.data.data.abilities.dex.value },
                { key: "data.abilities.con.value", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: randomActor.data.data.abilities.con.value },
                { key: "data.abilities.int.value", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: randomActor.data.data.abilities.int.value },
                { key: "data.abilities.wis.value", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: randomActor.data.data.abilities.wis.value },
                { key: "data.abilities.cha.value", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: randomActor.data.data.abilities.cha.value }
            ],
            origin: actor.uuid,
            disabled: false,
            duration: {
                rounds: 10, // Example: Set duration to 10 rounds (adjust as needed)
            },
            flags: {
                core: {
                    statusId: "polymorph"
                }
            }
        };

        // Apply the Polymorph effect to the target
        await targetActor.createEmbeddedDocuments("ActiveEffect", [polymorphEffectData]);

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: ${targetActor.name} is polymorphed into a random creature (${randomActor.name}).`
        });

        // Cast the original spell as well
        await MidiQOL.completeItemUse(spellCast, {}, { target: [targetToken] });
    },
    targetLovesCaster: async (actor, actorToken, spellCast, target) => {
        // Get the target's actor
        const targetActor = target.actor;

        // Define the Madly in Love status effect data
        const madlyInLoveEffectData = {
            label: "Madly in Love",
            icon: "icons/magic/control/charm-heart-glow-red.webp", // Use an appropriate icon for the madly in love status
            changes: [],
            origin: actor.uuid,
            disabled: false,
            flags: {
                core: {
                    statusId: "madlyInLove"
                },
                dae: {
                    specialDuration: ["Remove Curse"]
                }
            }
        };

        // Apply the Madly in Love status effect to the target
        await targetActor.createEmbeddedDocuments("ActiveEffect", [madlyInLoveEffectData]);

        // Play an animation using sequencer and jb2a to show the charm effect
        new Sequence()
            .effect()
            .file("jb2a.impact_themed.heart.02.pink") // Path to a suitable JB2A animation for the charm effect
            .atLocation(target)
            .scale(1) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: ${targetActor.name} falls madly in love with ${actor.name} until a Remove Curse spell is cast.`
        });

        // Cast the original spell as well
        await MidiQOL.completeItemUse(spellCast, {}, { target: [target] });
    },
    targetSexChange: async (actor, actorToken, spellCast, target) => {
        // Get the target's actor
        const targetActor = target.actor;

        // Determine the target's current sex and change it
        const currentSex = targetActor.data.data.details.sex;
        const newSex = currentSex === "male" ? "female" : "male";

        // Update the target's sex
        await targetActor.update({ "data.details.sex": newSex });

        // Play an animation using sequencer and jb2a to show the transformation effect
        new Sequence()
            .effect()
            .file("jb2a.detect_magic.circle.purple") // Path to a suitable JB2A animation for the transformation effect
            .atLocation(target)
            .scale(1) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: ${targetActor.name} changes sex from ${currentSex} to ${newSex}.`
        });

        // Cast the original spell as well
        await MidiQOL.completeItemUse(spellCast, {}, { target: [target] });
    },
    targetRainCloud: async (actor, actorToken, spellCast, target) => {
        // Get the target's token
        const targetToken = canvas.tokens.get(target.id);

        // Create the raincloud effect
        const raincloudEffectData = {
            label: "Raincloud",
            icon: "icons/weather/rain/raincloud-gray.webp", // Use an appropriate icon for the raincloud status
            origin: actor.uuid,
            disabled: false,
            duration: {
                rounds: 10, // Example: Set duration to 10 rounds (adjust as needed)
            },
            flags: {
                core: {
                    statusId: "raincloud"
                }
            }
        };

        // Apply the raincloud status effect to the target
        await target.actor.createEmbeddedDocuments("ActiveEffect", [raincloudEffectData]);

        // Play an animation using sequencer and jb2a to show the raincloud effect
        new Sequence()
            .effect()
            .file("jb2a.call_lightning.high_res.blue") // Path to a suitable JB2A animation for the raincloud
            .atLocation(targetToken)
            .scale(1) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .persist() // Make the effect persistent
            .name("raincloudEffect")
            .play();

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: A small, black raincloud forms over ${targetToken.name}.`
        });

        // Clean up the effect after the duration
        setTimeout(async () => {
            await Sequencer.EffectManager.endEffects({ name: "raincloudEffect" });
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: `The small, black raincloud over ${targetToken.name} dissipates.`
            });
        }, 10 * CONFIG.time.roundTime * 1000); // Adjust duration as needed

        // Cast the original spell as well
        await MidiQOL.completeItemUse(spellCast, {}, { target: [targetToken] });
    },
    targetStinkingCloud: async (actor, actorToken, spellCast, target) => {
        // Get the target's token
        const targetToken = canvas.tokens.get(target.id);

        // Define the Stinking Cloud spell data (you may need to adjust the spell ID to match your compendium)
        const spellName = "Stinking Cloud";

        // Search for the Stinking Cloud spell in the compendium
        const pack = game.packs.find(p => p.metadata.label === "Spells");
        const index = await pack.getIndex();
        const entry = index.find(e => e.name === spellName);
        if (!entry) {
            ui.notifications.error(`${spellName} spell not found in compendium.`);
            return;
        }

        // Load the Stinking Cloud spell from the compendium
        const stinkingCloudSpell = await pack.getDocument(entry._id);

        // Create a new instance of the Stinking Cloud spell
        const newSpell = new CONFIG.Item.documentClass(stinkingCloudSpell.toObject(), { parent: actor });


        // Cast the Stinking Cloud spell on the target
        const options = { showFullCard: false, createMeasuredTemplate: true, configureDialog: false };
        await MidiQOL.completeItemUse(newSpell, {}, { target: [targetToken] });

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: Stinking Cloud is cast on ${targetToken.name} in addition to the original spell.`
        });

        // Clean up the effect after the duration
        const duration = 10; // Adjust duration as needed (in rounds)
        setTimeout(async () => {
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: `The Stinking Cloud around ${targetToken.name} dissipates.`
            });
        }, duration * CONFIG.time.roundTime * 1000); // Convert duration to milliseconds

        // Cast the original spell as well
        await MidiQOL.completeItemUse(spellCast, {}, { target: [targetToken] });
    },
    targetHeavyObject: async (actor, actorToken, spellCast, target) => {
        // Get the target's token
        const targetToken = canvas.tokens.get(target.id);

        // Define the heavy object fall animation
        const heavyObjectAnimation = "jb2a.impact.boulder.01"; // Path to a suitable JB2A animation for a falling heavy object

        // Define the damage roll
        const damageRoll = new Roll("2d8").roll();
        damageRoll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: "Heavy object falling damage"
        });

        // Play an animation using sequencer and jb2a to show the heavy object falling
        new Sequence()
            .effect()
            .file(heavyObjectAnimation)
            .atLocation({ x: targetToken.x, y: targetToken.y - canvas.grid.size }) // Position above the target
            .scale(1) // Adjust scale as needed
            .fadeIn(500)
            .fadeOut(500)
            .play();

        // Apply the damage to the target
        await new MidiQOL.DamageOnlyWorkflow(actor, targetToken, damageRoll.total, "bludgeoning", [targetToken], damageRoll, {
            flavor: `Wild Magic Surge: A heavy object falls on ${targetToken.name}, causing 2d8 bludgeoning damage.`,
            itemCardId: "new"
        });

        // Create a chat message to indicate the wild magic effect
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `Wild Magic Surge: A heavy object falls on ${targetToken.name}, causing 2d8 bludgeoning damage.`
        });

        // Cast the original spell as well
        await MidiQOL.completeItemUse(spellCast, {}, { target: [targetToken] });
    }
}
