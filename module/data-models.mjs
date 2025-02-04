const { HTMLField, NumberField, SchemaField, StringField } = foundry.data.fields;

/* -------------------------------------------- */
/*  Actor Models                                */
/* -------------------------------------------- */

class ActorDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        // All Actors have resources.
        const schema = {};

        schema.resources = new SchemaField({
            health: new SchemaField({
                    min: new NumberField({ required: true, initial: 0 }),
                    value: new NumberField({ required: true, initial: 10 }),
                    max: new NumberField({ required: true, initial: 10 })
            }),
            hitDie: new SchemaField({
                    min: new NumberField({ required: true, initial: 0 }),
                    value: new NumberField({ required: true, initial: 10 })
            })
        });

        return schema;
    }
}

export class HeroDataModel extends ActorDataModel {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            class:  new SchemaField({
                value: new StringField({required: true, initial: "unassigned" }),
                label: new StringField({required: true, initial: "" }),
            }),
            level: new NumberField({ required: true, initial: 0 }),
            xp: new NumberField({ required: true, initial: 0 }),
            abilities: new SchemaField(Object.keys(CONFIG.OSR.abilities).reduce((obj, ability) => {
                obj[ability] = new SchemaField({
                    value: new NumberField({required: true, nullable: false, integer: true, initial: 10, min: 3, max: 18 }),
                    mod: new NumberField({required: true, nullable: false, integer: true, initial: 0, min: -3, max: 3 }),
                    save: new NumberField({required: true, nullable: false, integer: true, initial: 0, min: -3, max: 3 }),
                    label: new StringField({required: true, blank: true })
                });
                return obj;
            }, {})),
            skills: new SchemaField(Object.keys(CONFIG.OSR.skills).reduce((obj, skill) => {
                obj[skill] = new SchemaField({
                    mod: new NumberField({required: true, nullable: false, integer: true, initial: 0, min: -3, max: 3 }),
                    label: new StringField({required: true, blank: true })
                });
                return obj;
            }, {})),
            combat: new SchemaField({
                armorClass: new SchemaField({
                    base: new NumberField({ required: true, initial: 12 }),
                    mod: new NumberField({ required: true, initial: 0 }),
                    total: new NumberField({ required: true, initial: 0 })

                }),
                attack: new SchemaField({
                    bab: new NumberField({ required: true, initial: 0 }),
                    melee: new NumberField({ required: true, initial: 0 }),
                    ranged: new NumberField({ required: true, initial: 0 }),
                }),
                initiative: new SchemaField({
                    mod: new NumberField({ required: true, initial: 0 }),
                    bonus: new NumberField({ required: true, initial: 0 }),
                }),
            }),
            classFeatures: new HTMLField({ required: true, blank: true }),
            background: new SchemaField({
                biography: new HTMLField({ required: true, blank: true })
            }),
            equipment: new SchemaField({
                armor: new SchemaField(Array.from({ length: 2 }, (_, i) => i + 1).reduce((obj, i) => {
                    obj[`slot${i}`] = new SchemaField({
                        name: new HTMLField({ required: true, blank: true }),
                        mod: new HTMLField({ required: true, blank: true }),
                        notes: new HTMLField({ required: true, blank: true })
                    });
                    return obj;
                }, {})),
                weapons: new SchemaField(Array.from({ length: 4 }, (_, i) => i + 1).reduce((obj, i) => {
                    obj[`slot${i}`] = new SchemaField({
                        name: new HTMLField({ required: true, blank: true }),
                        damage: new HTMLField({ required: true, blank: true }),
                        notes: new HTMLField({ required: true, blank: true })
                    });
                    return obj;
                }, {})),
                items: new SchemaField(Array.from({ length: 21 }, (_, i) => i + 1).reduce((obj, i) => {
                    obj[`slot${i}`] = new SchemaField({
                        description: new HTMLField({ required: true, blank: true }),
                        scarcityDie: new HTMLField({ required: true, blank: true })
                    });
                    return obj;
                }, {})),
                nonencumberingItems: new SchemaField({
                    value: new HTMLField({ required: true, blank: true })
                }),
                treasure: new SchemaField({
                    value: new HTMLField({ required: true, blank: true })
                })
            }),
        };
    }

    prepareDerivedData() {
        ////////////////////////////
        // Handle class features. //
        ////////////////////////////
        const classData = CONFIG.OSR.classes[this.class.value];

        // Only add features if no class was selected.
        if (classData) {

            // iterate over all level ups
            for (let i = 0; i <= this.level; i++) {
                const levelData = classData.levels[i];

                // Only add features if the level has features.
                if (levelData) {
                    // Handle saving throw increases.
                    for (const [key, value] of Object.entries(levelData.saving_throw_increases)) {
                        this.abilities[key].save += value;
                    }
                    // Handle base attack bonus increases.
                    this.combat.attack.bab += levelData.bab;

                    // Handle skill increases.
                    for (const [key, value] of Object.entries(levelData.skills)) {
                        this.skills[key].mod += value;
                    }

                    for (const feature of classData.features) {
                        this.classFeatures += feature;
                    }
                }
            }
        }

        ///////////////////////////////
        // Handle ability modifiers. //
        ///////////////////////////////
        // Loop through ability scores, and add their modifiers to our sheet output.
        for (const key in this.abilities) {
            // Calculate the modifier using an array.
            this.abilities[key].mod = CONFIG.OSR.abilityModifiers[this.abilities[key].value];
            
            // Handle ability label localization.
            this.abilities[key].label = game.i18n.localize(CONFIG.OSR.abilities[key]) ?? key;
        }

        ///////////////////////////
        // Handle combat values. //
        ///////////////////////////
        this.combat.attack.melee = this.combat.attack.bab + this.abilities.str.mod;
        this.combat.attack.ranged = this.combat.attack.bab + this.abilities.dex.mod;
        this.combat.initiative.mod = this.abilities.dex.mod + this.combat.initiative.bonus;

        this.combat.armorClass.total = this.combat.armorClass.base + this.abilities.dex.mod + this.combat.armorClass.mod;

        // display class features
        if (classData){
            this.classFeatures = "";
            classData.features.forEach(feature => {
                this.classFeatures += "<h3>" + game.i18n.localize(`OSR.ClassFeatures.${feature}.title`) + "</h2>";
                this.classFeatures += game.i18n.localize(`OSR.ClassFeatures.${feature}.description`);
            });
        }

        //////////////////////////
        // Handle localization. //
        //////////////////////////
        for (const key in this.skills) {
            // Handle skill label localization.
            this.skills[key].label = game.i18n.localize(CONFIG.OSR.skills[key]) ?? key;
        }

        // Handle class label localization.
        this.class.label = game.i18n.localize(CONFIG.OSR.classes[this.class.value].label) ?? key;
    }

    /**
     * Override getRollData() that's supplied to rolls.
     */
    getRollData() {
        const data = super.getRollData();

        // Copy the ability scores to the top level, so that rolls can use
        // formulas like `@str.mod + 4`.
        if (this.abilities) {
            for (let [k,v] of Object.entries(this.abilities)) {
                data[k] = foundry.utils.deepClone(v);
            }
        }

        return data;
    }
}

export class NpcDataModel extends ActorDataModel {
    static defineSchema() {
        return {
                ...super.defineSchema(),
                modifiers: new SchemaField(Object.keys(CONFIG.OSR.abilities).reduce((obj, ability) => {
                    obj[ability] = new SchemaField({
                        value: new NumberField({required: true, nullable: false, integer: true, initial: 0, min: -3, max: 3 }),
                        label: new StringField({required: true, blank: true })
                    });
                    return obj;
                }, {})),
                save: new SchemaField({
                    value: new NumberField({ required: true, initial: 0 })
                }),
                morale: new SchemaField({
                        value: new NumberField({ required: true, initial: 10 })
                }),
                features: new HTMLField({ required: true, blank: true }),
                notes: new HTMLField({ required: true, blank: true })
        };
    }

    prepareDerivedData() {
        // Loop through ability scores, and add their modifiers to our sheet output.
        for (const key in this.modifiers) {
            // Handle ability label localization.
            this.modifiers[key].label = game.i18n.localize(CONFIG.OSR.abilityAbbreviations[key]) ?? key;
        }
    }
}

/* -------------------------------------------- */
/*  Item Models                                 */
/* -------------------------------------------- */

class ItemDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return {
            rarity: new StringField({
                required: true,
                blank: false,
                options: ["common", "uncommon", "rare", "legendary"],
                initial: "common"
            }),
            price: new NumberField({ required: true, initial: 20 })
        };
    }
}

export class WeaponDataModel extends ItemDataModel {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            damage: new NumberField({ required: true, positive: true, initial: 5 })
        };
    }
}

export class SpellDataModel extends ItemDataModel {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            cost: new NumberField({ required: true, positive: true, initial: 2 })
        };
    }
}

export class GenericDataModel extends ItemDataModel {
        static defineSchema() {
            return {
                ...super.defineSchema(),
                cost: new NumberField({ required: true, positive: true, initial: 2 })
            };
        }
    }