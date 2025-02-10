export class Utils {
    static validateRollDate(rollData) {
        let rollRegex = /^(\d+d\d+)([+-]\d*)?$/;
        return rollRegex.test(rollData);
    }

    static async renderRoll(dataset, rollingActor) {
        let roll = new Roll(dataset.roll, rollingActor.getRollData());
        await roll.evaluate();

        let success = true;

        if (dataset.type == 'check') {
            success = roll.total >= 6;
        }
        else if (dataset.type == 'save') {
            // TODO: add auto fail/ success
            success = roll.total >= 10;
        } else {
            console.warn('Invalid roll type! ' + dataset.type);
        }

        // Render the roll's default HTML
        let rollHTML = await roll.render();

        // Construct the chat message content
        let color = success ? "green" : "red";
        let message = success ? "Success" : "Failure";
        let customMessage = `
            <div>
                ${dataset.label}: <span style="color:${color}">${message} </span>
            </div>
        `;

        // Combine the custom message and roll HTML
        let chatContent = `
            ${customMessage}
            ${rollHTML}
        `;

        // send the message to the chat
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: rollingActor }),
            content: chatContent,
            rolls: [roll]
        });
    }
}