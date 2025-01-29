import { OSR } from "../helpers/config.mjs";

export class SystemActor extends Actor {
    constructor(data, context) {
        super(data, context);

        let updateData = {};

        // TODO: fix this being called twice (first time the updateData has no _id)
        // Loop through ability scores, assign a random value.
        for (const key in OSR.abilities) {
            // Roll 3d6 to get the ability score. Because the calculation returns
            // a value between 0 and 5 for every roll, we add 3 to the total to
            // get a value between 3 and 18.
            let roll = Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 3;
            updateData[`system.abilities.${key}.value`] = roll;
        }

        console.log(updateData);

        // TODO: check if the score is valid or if a sibling died

        this.update(updateData);
    }

    async applyDamage(damage) {
        // Always take a minimum of 1 damage, and round to the nearest integer.
        damage = Math.round(Math.max(1, damage));

        // Update the health.
        const { value } = this.system.resources.health;
        await this.update({ "system.resources.health.value": value - damage });

        // Log a message.
        await ChatMessage.implementation.create({
        content: `${this.name} took ${damage} damage!`
        });
    }
}

export class SystemItem extends Item {
    get isFree() {
        return this.price < 1;
    }
}