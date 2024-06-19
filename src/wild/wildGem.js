export default class WildGem {
    const gem = {
        type: "loot",
        data: {
            description: {
                value: ''
            },
            source: "",
            quantity: 1,
            weight: 0.1,
            price: undefined,
            equipped: false,
            identified: true,
            rarity: "common",
            attunement: 0,
            attuned: false,
            attributes: {},
            actionType: "",
            activation: {},
            duration: {},
            target: {},
            range: {},
            uses: {
                value: 0,
                max: 0,
                per: null
            },
            consume: {},
            ability: "",
            attackBonus: 0,
            chatFlavor: "",
            critical: {
                threshold: null,
                damage: ""
            },
            damage: {
                parts: [],
                versatile: ""
            },
            formula: "",
            save: {
                ability: "",
                dc: null,
                scaling: "spell"
            },
            requirements: "",
            recharge: {
                value: null,
                charged: false
            }
        },
        img: "icons/commodities/gems/gem-faceted-green.webp"
    };
    constructor(index, price) {
       this.gem.name = `Gem ${i}`;
       this.gem.data.description.value = `A valuable gem worth ${price} gp.`;
       this.gem.data.price = price;
    }
}