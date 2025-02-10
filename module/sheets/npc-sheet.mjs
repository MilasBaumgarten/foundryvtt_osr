import { Utils } from "../../helpers/utils.mjs";

// TODO: check morale check values

export class NPCSheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        template: "systems/osr/templates/npc/npc-sheet.hbs",
        width: 450,
        height: 500,
        tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "features" }]
      });
    }
  
    /** @override */
    async getData(options) {
      const context = super.getData(options);
      
        // clone the data of the actor
        const actorData = context.data;

        // Add the actor's data to context.data for easier access, as well as flags.
        context.system = actorData.system;
        context.flags = actorData.flags;

        // Add roll data for TinyMCE editors.
        context.rollData = context.actor.getRollData();

        // enrich data
        context.enrichedFeatures = await TextEditor.enrichHTML(actorData.system.features, { secrets: this.actor.isOwner, entities: true });
        context.enrichednotes = await TextEditor.enrichHTML(actorData.system.notes, { secrets: this.actor.isOwner, entities: true });

        return context;
    }

    /** @override */
    async activateListeners(html) {
        super.activateListeners(html);

        // -------------------------------------------------------------
        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;
    
        // Rollable abilities.
        html.on('click', '.rollable', this._onRoll.bind(this));
        html.on('click', '.clickable', this._onClick.bind(this));
    }

    _onClick(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        if (dataset.type) {
            if (dataset.type == 'roll-weapon-damage') {
                // validate roll data using regex
                if (Utils.validateRollDate(dataset.roll)) {
                    Roll.create(dataset.roll).toMessage({
                        flavor: dataset.label ? `${dataset.label}` : ''
                    });
                } else {
                    console.warn('Invalid roll data!' + dataset.roll);
                }
            }
        }
    }

    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    async _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        if (dataset.roll) {
            if (dataset.type == 'check' || dataset.type == 'save') {
                Utils.renderRoll(dataset, this.actor);
            } else {
                // Render the roll
                new Roll(dataset.roll, rollingActor.getRollData()).toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                    flavor: dataset.label ? `${dataset.label}` : ''
                });
            }
        }
    }
}