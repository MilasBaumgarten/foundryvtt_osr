import { OSR } from "../helpers/config.mjs";

export class SystemActor extends Actor {
    constructor(data, context) {
        super(data, context);

        // TODO: fix this being called twice (first time the updateData has no _id)
        // Loop through ability scores, assign a random value.
        // Afterwards check if the sum of the ability modifiers is greater than 0.
        // If not, a sibling has died and a new character gets rolled.
        let modSum = 0;
        let deadCharacters = 0;
        let updateData;
        do{
            updateData = {};
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

        this.update(updateData);
    }

    // async applyDamage(damage) {
    //     // Always take a minimum of 1 damage, and round to the nearest integer.
    //     damage = Math.round(Math.max(1, damage));

    //     // Update the health.
    //     const { value } = this.system.resources.health;
    //     await this.update({ "system.resources.health.value": value - damage });

    //     // Log a message.
    //     await ChatMessage.implementation.create({
    //     content: `${this.name} took ${damage} damage!`
    //     });
    // }
}

export class SystemItem extends Item {
    get isFree() {
        return this.price < 1;
    }
}