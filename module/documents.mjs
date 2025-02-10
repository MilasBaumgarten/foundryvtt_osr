import { OSR } from "../helpers/config.mjs";

export class SystemActor extends Actor {
    constructor(data, context) {
        super(data, context);

        // don't initialize if no id is available (aka. too early)
        if (!data._id) {
            return;
        } else if (data.type == "pc") {
            __initializePC();
        } else if (data.type == "npc") {
            // TODO: roll HP once when creating a token
        }
    }

    __initializePC() {
        // Loop through ability scores, assign a random value.
        // Afterwards check if the sum of the ability modifiers is greater than 0.
        // If not, a sibling has died and a new character gets rolled.
        let modSum = 0;
        let deadCharacters = 0;
        let updateData;
        do{
            updateData = {};
            modSum = 0;
            for (const key in OSR.abilities) {
                // Roll 3d6 to get the ability score. Because the calculation returns
                // a value between 0 and 5 for every roll, we add 3 to the total to
                // get a value between 3 and 18.
                let roll = Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 3;
                updateData[`system.abilities.${key}.value`] = roll;
                modSum += OSR.abilityModifiers[roll];

                if (modSum < 0) {
                    deadCharacters++;
                }
            }
        } while(modSum < 0);

        // TODO: add dead characters to player background sheet

        // Add starting equipment
        for (const key in OSR.startingEquipment) {
            updateData[`system.equipment.items.slot${key}`] = OSR.startingEquipment[key];
        }
        updateData["system.equipment.treasure.value"] = `${Math.ceil(Math.random() * 6)} gold pieces (each worth 50 silver pieces)`
        
        // link tokens to thsi actor
        updateData["prototypeToken.actorLink"] = true;
        
        this.update(updateData);
    }

    getRollData() {
        const data = super.getRollData();

        // Copy the ability scores to the top level, so that rolls can use
        // formulas like `@str.mod + 4`.
        if (data.abilities) {
            for (let [k,v] of Object.entries(data.abilities)) {
                data[k] = foundry.utils.deepClone(v);
            }
        }

        return data;
    }
}