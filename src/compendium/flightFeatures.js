import Features from "../constants/features";

export const flightFeatures = [
    {
        name: Features.FlyingLabel,
        type: "feat",
        system: {
            description: {
                "value": "<p>Take flight, allowing you to see over objects and move over the battlefield</p>",
                "chat": "<p>Take flight, allowing you to see over objects and move over the battlefield</p>"
            },
            source: {},
            activation: {
                type: "action",
                cost: 1,
                condition: ""
            },
            duration: {
                value: "",
                units: ""
            },
            cover: null,
            crewed: false,
            target: {
                value: "",
                width: null,
                units: "",
                type: "self",
                prompt: true
            },
            range: {
                value: null,
                long: null,
                units: "self"
            },
            uses: {
                value: null,
                max: "",
                per: null,
                recovery: "",
                prompt: true
            },
            consume: {
                type: "",
                target: null,
                amount: null,
                scale: false
            },
            ability: "none",
            actionType: "util",
            attack: {
                bonus: "",
                flat: false
            },
            chatFlavor: "",
            critical: {
                threshold: null,
                damage: ""
            },
            damage: {
                parts: [],
                versatile: ""
            },
            enchantment: null,
            formula: "",
            save: {
                ability: "",
                dc: null,
                scaling: "spell"
            },
            summons: null,
            type: {
                value: "race",
                subtype: ""
            },
            prerequisites: {
                "level": null
            },
            properties: [],
            requirements: "",
            recharge: {
                value: null,
                charged: false
            }
        },
        img: Features.FlyingImage,
        effects: []
    },
    {
        name: Features.LandLabel,
        type: "feat",
        system: {
            description: {
                "value": "<p>Land on the ground, removing flying status.</p>",
                "chat": "<p>Land on the ground, removing flying status.</p>"
            },
            source: {},
            activation: {
                type: "action",
                cost: 1,
                condition: ""
            },
            duration: {
                value: "",
                units: ""
            },
            cover: null,
            crewed: false,
            target: {
                value: "",
                width: null,
                units: "",
                type: "self",
                prompt: true
            },
            range: {
                value: null,
                long: null,
                units: "self"
            },
            uses: {
                value: null,
                max: "",
                per: null,
                recovery: "",
                prompt: true
            },
            consume: {
                type: "",
                target: null,
                amount: null,
                scale: false
            },
            ability: "none",
            actionType: "util",
            attack: {
                bonus: "",
                flat: false
            },
            chatFlavor: "",
            critical: {
                threshold: null,
                damage: ""
            },
            damage: {
                parts: [],
                versatile: ""
            },
            enchantment: null,
            formula: "",
            save: {
                ability: "",
                dc: null,
                scaling: "spell"
            },
            summons: null,
            type: {
                value: "race",
                subtype: ""
            },
            prerequisites: {
                "level": null
            },
            properties: [],
            requirements: "",
            recharge: {
                value: null,
                charged: false
            }
        },
        img: Features.LandImage,
        effects: []
    },
    {
        name: Features.RaiseLabel,
        type: "feat",
        system: {
            description: {
                "value": "<p>Increase the height at which you are flying</p>",
                "chat": "<p>Increase the height at which you are flying</p>"
            },
            source: {},
            activation: {
                type: "action",
                cost: 1,
                condition: ""
            },
            duration: {
                value: "",
                units: ""
            },
            cover: null,
            crewed: false,
            target: {
                value: "",
                width: null,
                units: "",
                type: "self",
                prompt: true
            },
            range: {
                value: null,
                long: null,
                units: "self"
            },
            uses: {
                value: null,
                max: "",
                per: null,
                recovery: "",
                prompt: true
            },
            consume: {
                type: "",
                target: null,
                amount: null,
                scale: false
            },
            ability: "none",
            actionType: "util",
            attack: {
                bonus: "",
                flat: false
            },
            chatFlavor: "",
            critical: {
                threshold: null,
                damage: ""
            },
            damage: {
                parts: [],
                versatile: ""
            },
            enchantment: null,
            formula: "",
            save: {
                ability: "",
                dc: null,
                scaling: "spell"
            },
            summons: null,
            type: {
                value: "race",
                subtype: ""
            },
            prerequisites: {
                "level": null
            },
            properties: [],
            requirements: "",
            recharge: {
                value: null,
                charged: false
            }
        },
        img: Features.RaiseImage,
        effects: []
    },
    {
        name: Features.LowerLabel,
        type: "feat",
        system: {
            description: {
                "value": "<p>Decrease the height at which you are flying</p>",
                "chat": "<p>Decrease the height at which you are flying</p>"
            },
            source: {},
            activation: {
                type: "action",
                cost: 1,
                condition: ""
            },
            duration: {
                value: "",
                units: ""
            },
            cover: null,
            crewed: false,
            target: {
                value: "",
                width: null,
                units: "",
                type: "self",
                prompt: true
            },
            range: {
                value: null,
                long: null,
                units: "self"
            },
            uses: {
                value: null,
                max: "",
                per: null,
                recovery: "",
                prompt: true
            },
            consume: {
                type: "",
                target: null,
                amount: null,
                scale: false
            },
            ability: "none",
            actionType: "util",
            attack: {
                bonus: "",
                flat: false
            },
            chatFlavor: "",
            critical: {
                threshold: null,
                damage: ""
            },
            damage: {
                parts: [],
                versatile: ""
            },
            enchantment: null,
            formula: "",
            save: {
                ability: "",
                dc: null,
                scaling: "spell"
            },
            summons: null,
            type: {
                value: "race",
                subtype: ""
            },
            prerequisites: {
                "level": null
            },
            properties: [],
            requirements: "",
            recharge: {
                value: null,
                charged: false
            }
        },
        img: Features.LowerImage,
        effects: []
    }
];