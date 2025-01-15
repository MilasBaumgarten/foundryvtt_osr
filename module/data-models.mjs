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
      hit_die: new SchemaField({
          min: new NumberField({ required: true, initial: 0 }),
          value: new NumberField({ required: true, initial: 10 })
      }),
      armor_class: new SchemaField({
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
        value: new StringField({required: true, initial: "select class" }),
        label: new StringField({required: true, initial: "select class" }),
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
      class_features: new HTMLField({ required: true, blank: true }),
      background: new SchemaField({
        biography: new HTMLField({ required: true, blank: true })
      })
    };
  }

  prepareDerivedData() {
    // Loop through ability scores, and add their modifiers to our sheet output.
    for (const key in this.abilities) {
      // Calculate the modifier using an array.
      this.abilities[key].mod = CONFIG.OSR.abilityModifiers[this.abilities[key].value];
      if (this.class.value == "rogue") {
        this.abilities[key].save = 1;
      } else {
        this.abilities[key].save = 0;
      }
      
      // Handle ability label localization.
      this.abilities[key].label = game.i18n.localize(CONFIG.OSR.abilities[key]) ?? key;
    }

    // Loop through skills, and add labels.
    for (const key in this.skills) {
      // Handle ability label localization.
      this.skills[key].label = game.i18n.localize(CONFIG.OSR.skills[key]) ?? key;
    }

    // Handle class label localization.
    this.class.label = game.i18n.localize(CONFIG.OSR.classes[this.class.value]) ?? key;
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