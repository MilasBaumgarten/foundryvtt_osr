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
        // Dialog to select class and skill improvements
        new Dialog({
            title: 'Class Selection',
            content: `
            <form class="flexcol">
                <div class="form-group">
                    <label for="classSelection">Class</label>
                    <select name="classSelection">
                        <option value="rogue">The Rogue</option>
                        <option value="sorcerer">The Sorcerer</option>
                        <option value="warrior">The Warrior</option>
                    </select>
                </div>
                <div>
                    <div>
                        Either select 2 skills that will get +1 or roll to 
                        improve one random skill by +1 and another by +2. If
                        both skills are the same, the corresponding skill gets 
                        improved by +3.
                    </div>

                    <div class="form-group">
                        <select name="skillSelection1">
                            <option value="random">Random</option>
                            <option value="arcana">Arcana</option>
                            <option value="climbing">Climbing</option>
                            <option value="firstAid">First Aid</option>
                            <option value="literacy">Literacy</option>
                            <option value="seamanship">Seamanship</option>
                            <option value="search">Search</option>
                            <option value="sleightOfHand">Sleight of Hand</option>
                            <option value="stealth">Stealth</option>
                            <option value="survival">Survival</option>
                            <option value="tinkering">Tinkering</option>
                        </select>

                        <select name="skillSelection2">
                            <option value=""></option>
                            <option value="arcana">Arcana</option>
                            <option value="climbing">Climbing</option>
                            <option value="firstAid">First Aid</option>
                            <option value="literacy">Literacy</option>
                            <option value="seamanship">Seamanship</option>
                            <option value="search">Search</option>
                            <option value="sleightOfHand">Sleight of Hand</option>
                            <option value="stealth">Stealth</option>
                            <option value="survival">Survival</option>
                            <option value="tinkering">Tinkering</option>
                        </select>
                    </div>
                </div>
            </form>
            `,
            buttons: {
                no: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel'
                },
                yes: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Confirm',
                    callback: (html) => {
                        let characterClass = html.find('[name="classSelection"]').val();
                        let skillImprovement1 = html.find('[name="skillSelection1"]').val();
                        let skillImprovement2 = html.find('[name="skillSelection2"]').val();

                        this.__selectClass(characterClass);
                        this.__selectSkillImprovements(skillImprovement1, skillImprovement2);
                    }
                },
            },
            default: 'yes'
        }).render(true)

        // TODO: implement skill choice for rogue
    }

    __selectClass(className) {
        this.actor.update({
            "system.class.value": className,
            "system.level": 1
        });
    }

    __selectSkillImprovements(improvement1, improvement2) {
        let updateData = {};

        // set every skill mod to 0
        for (let skill in this.actor.system.skills) {
            updateData[`system.skills.${skill}.mod`] = 0;
        }

        if (improvement1 == 'random') {
            // get skill amount
            let skills = Object.keys(this.actor.system.skills);
            let skillAmount = skills.length;

            // get a random skill and improve it by +1
            let randomSkillIndex = Math.floor(Math.random() * skillAmount);
            updateData[`system.skills.${skills[randomSkillIndex]}.mod`] += 1;

            // get another random skill and improve it by +2
            randomSkillIndex = Math.floor(Math.random() * skillAmount);
            updateData[`system.skills.${skills[randomSkillIndex]}.mod`] += 2;
        } else {
            updateData[`system.skills.${improvement1}.mod`] += 1;
            updateData[`system.skills.${improvement2}.mod`] += 1;
        }

        this.actor.update(updateData);
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
                    // TODO: display a popup with the ability to select modifiers before roll
                    // TODO: add option for impossible to fail/ succeed roll (2d6)
                        // impossible to fail: 2x 1 = fail
                        // impossible to succeed: 2x 6 = success
                    success = roll.total >= 6;
                }
                else if (dataset.type == 'save') {
                    success = roll.total >= 10;
                }
                else if (dataset.type == 'attack') {
                    // TODO: display a popup with the ability to select modifiers before roll
                }
            }

            // TODO: color message based on success

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