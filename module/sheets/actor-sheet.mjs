/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class PlayerActorSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ["osr", "sheet", "actor"],
        template: "systems/osr/templates/actor/actor-sheet.hbs",
        width: 600,
        height: 600,
        tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "features" }]
      });
    }

    getData() {
        // get the data structure from the base sheet
        const context = super.getData();

        // clone the data of the actor
        const actorData = context.data;

        // Add the actor's data to context.data for easier access, as well as flags.
        context.system = actorData.system;
        context.flags = actorData.flags;

        // Prepare character data and items.
        if (actorData.type == 'hero') {
            this._prepareItems(context);
        }

        // Prepare NPC data and items.
        if (actorData.type == 'npc') {
            this._prepareItems(context);
        }

        // Add roll data for TinyMCE editors.
        context.rollData = context.actor.getRollData();

        return context;
    }

    /**
     * Organize and classify Items for Character sheets.
     *
     * @param {Object} actorData The actor to prepare.
     *
     * @return {undefined}
     */
    _prepareItems(context) {
        // Initialize containers.
        const gear = [];
        const features = [];
        const spells = {
        0: [],
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: [],
        7: [],
        8: [],
        9: []
        };
    
        // Iterate through items, allocating to containers
        for (let i of context.items) {
            i.img = i.img || DEFAULT_TOKEN;
            // Append to gear.
            if (i.type === 'item') {
                gear.push(i);
            }
            // Append to features.
            else if (i.type === 'feature') {
                features.push(i);
            }
            // Append to spells.
            else if (i.type === 'spell') {
                if (i.system.spellLevel != undefined) {
                spells[i.system.spellLevel].push(i);
                }
            }
        }
    
        // Assign and return
        context.gear = gear;
        context.features = features;
        context.spells = spells;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
    
        // Render the item sheet for viewing/editing prior to the editable check.
        html.on('click', '.item-edit', (ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const item = this.actor.items.get(li.data('itemId'));
            item.sheet.render(true);
        });
    
        // -------------------------------------------------------------
        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;
    
        // Add Inventory Item
        html.on('click', '.item-create', this._onItemCreate.bind(this));
    
        // Delete Inventory Item
        html.on('click', '.item-delete', (ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const item = this.actor.items.get(li.data('itemId'));
            item.delete();
            li.slideUp(200, () => this.render(false));
        });
    
        // Rollable abilities.
        html.on('click', '.rollable', this._onRoll.bind(this));
        html.on('click', '.clickable', this._onClick.bind(this));
    }

    /**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event   The originating click event
     * @private
     */
    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        // Get the type of item to create.
        const type = header.dataset.type;
        // Grab any data associated with this control.
        const data = duplicate(header.dataset);
        // Initialize a default name.
        const name = `New ${type.capitalize()}`;
        // Prepare the item object.
        const itemData = {
            name: name,
            type: type,
            data: data
        };
        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData.data["type"];
    
        // Finally, create the item!
        return await Item.create(itemData, {parent: this.actor});
    }

    _onClick(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        if (dataset.type) {
            if (dataset.type == 'select-class') {
                this.__onSelectClass();
            }
        }
    }

    __onSelectClass() {
        new Dialog({
            title: 'Class Selection',
            content: `Please select your prefered class.`,
            buttons: {
              rogue: {
                label: 'The Rogue',
                callback: () => this.__selectedClass("rogue")
              },
              sorcerer: {
                label: 'The Sorcerer',
                callback: () => this.__selectedClass("sorcerer")
              },
              warrior: {
                label: 'The Warrior',
                callback: () => this.__selectedClass("warrior")
              }
            }
        }).render(true);
    }

    __selectedClass(className) {
        this.actor.update({
            "system.class.value": className
        });
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
            let roll = new Roll(dataset.roll, this.actor.getRollData());
            await roll.evaluate();

            let success = true;

            if (dataset.type) {
                if (dataset.type == 'check') {
                    success = roll.total >= 6;
                }
                else if (dataset.type == 'save') {
                    success = roll.total >= 10;
                }
            }

            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: dataset.label ? `${dataset.label}` : '',
                // content: `<div>${roll.total} ${success ? 'Success' : 'Failure'}</div>`,
                rolls: [roll]
            });
            return roll;
        }
    }
}