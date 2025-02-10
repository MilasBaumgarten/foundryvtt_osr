import { OSR } from "../../helpers/config.mjs";
import { Utils } from "../../helpers/utils.mjs";

export class PlayerActorSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
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

        // Add roll data for TinyMCE editors.
        context.rollData = context.actor.getRollData();

        return context;
    }

    /** @override */
    activateListeners(html) {
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
            if (dataset.type == 'select-class') {
                this.__onSelectClass();
            } else if (dataset.type == 'roll-weapon-damage') {
                // validate roll data using regex
                if (Utils.validateRollDate(dataset.roll)) {
                    Roll.create(dataset.roll).toMessage({
                        flavor: dataset.label ? `${dataset.label}` : ''
                    });
                } else {
                    console.warn('Invalid roll data!' + dataset.roll);
                }
            } else if (dataset.type == 'roll-scarcity') {
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

                        this.__selectClass(characterClass);

                        if (characterClass == 'rogue') {
                            this.__onSelectRogueSkills();
                        } else {
                            this.__onSelectTwoSkills();
                        }
                    }
                },
            },
            default: 'yes'
        }).render(true)
    }

    __selectClass(className) {
        let updateData = {
            "system.class.value": className,
            "system.level": 1
        };

        // TODO: set HP
        
        // add class specific starting equipment
        let equipment = OSR.classes[className].equipment;
        
        for (const index in equipment.weapons) {
            updateData[`system.equipment.weapons.slot${Number(index) + 1}`] = equipment.weapons[index];
        }
        for (const index in equipment.armor) {
            updateData[`system.equipment.armor.slot${Number(index) + 1}`] = equipment.armor[index];
            updateData['system.combat.armorClass.mod'] = equipment.armor[index].mod;
        }
        for (const index in equipment.items) {
            // skip the already added items to not overwrite anything
            updateData[`system.equipment.items.slot${Number(index) + OSR.startingEquipment.length}`] = equipment.items[index];
        }

        this.actor.update(updateData);
    }

    __onSelectTwoSkills() {
        // Dialog to select class and skill improvements
        new Dialog({
            title: 'Skill Selection',
            content: `
            <form class="flexcol">
                <div>
                    <div>
                        Either select 2 skills that will get +1 or roll to 
                        improve one random skill by +1 and another by +2. If
                        both skills are the same, the corresponding skill gets 
                        improved by +3.
                    </div>

                    <div class="form-group">
                        <select name="skillSelection1">
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
                random: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Random',
                    callback: (html) => {
                        this.__selectSkillImprovements("random", "random");
                    }
                },
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Confirm',
                    callback: (html) => {
                        let skillImprovement1 = html.find('[name="skillSelection1"]').val();
                        let skillImprovement2 = html.find('[name="skillSelection2"]').val();

                        this.__selectSkillImprovements(skillImprovement1, skillImprovement2);
                    }
                },
            },
            default: 'yes'
        }).render(true)
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

    __onSelectRogueSkills() {
        // Dialog to select class and skill improvements
        new Dialog({
            title: 'Skill Selection',
            content: `
            <form class="flexcol">
                <div>
                    <div>
                        You may allocate 6 points to any skills you wish. Increasing
                        a skill costs a number of points equal to its new total.
                    </div>

                    <div class="skills-list">
                        <div class="skill-row">
                            <span class="skill-name" id="arcana">Arcana</span>
                            <button class="minus-btn">-</button>
                            <span class="skill-value">0</span>
                            <button class="plus-btn">+</button>
                        </div>
                        <div class="skill-row">
                            <span class="skill-name" id="climbing">Climbing</span>
                            <button class="minus-btn">-</button>
                            <span class="skill-value">0</span>
                            <button class="plus-btn">+</button>
                        </div>
                        <div class="skill-row">
                            <span class="skill-name" id="firstAid">First Aid</span>
                            <button class="minus-btn">-</button>
                            <span class="skill-value">0</span>
                            <button class="plus-btn">+</button>
                        </div>
                        <div class="skill-row">
                            <span class="skill-name" id="literacy">Literacy</span>
                            <button class="minus-btn">-</button>
                            <span class="skill-value">0</span>
                            <button class="plus-btn">+</button>
                        </div>
                        <div class="skill-row">
                            <span class="skill-name" id="seamanship">Seamanship</span>
                            <button class="minus-btn">-</button>
                            <span class="skill-value">0</span>
                            <button class="plus-btn">+</button>
                        </div>
                        <div class="skill-row">
                            <span class="skill-name" id="search">Search</span>
                            <button class="minus-btn">-</button>
                            <span class="skill-value">0</span>
                            <button class="plus-btn">+</button>
                        </div>
                        <div class="skill-row">
                            <span class="skill-name" id="sleightOfHand">Sleight of Hand</span>
                            <button class="minus-btn">-</button>
                            <span class="skill-value">0</span>
                            <button class="plus-btn">+</button>
                        </div>
                        <div class="skill-row">
                            <span class="skill-name" id="stealth">Stealth</span>
                            <button class="minus-btn">-</button>
                            <span class="skill-value">0</span>
                            <button class="plus-btn">+</button>
                        </div>
                        <div class="skill-row">
                            <span class="skill-name" id="survival">Survival</span>
                            <button class="minus-btn">-</button>
                            <span class="skill-value">0</span>
                            <button class="plus-btn">+</button>
                        </div>
                        <div class="skill-row">
                            <span class="skill-name" id="tinkering">Tinkering</span>
                            <button class="minus-btn">-</button>
                            <span class="skill-value">0</span>
                            <button class="plus-btn">+</button>
                        </div>
                    </div>
                </div>
            </form>
            `,
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Confirm',
                    callback: (html) => {
                        // get the improved skills
                        let skillUpdates = {};
                        html.find('.skill-row').each((index, row) => {
                            const skillName = $(row).find('.skill-name').attr('id');
                            const skillValue = parseInt($(row).find('.skill-value').text().trim());
                            if (skillValue > 0) {
                                skillUpdates[skillName] = skillValue;
                            }
                        });

                        this.__updateSkills(skillUpdates);
                    }
                },
            },
            default: 'yes',
            render: html => {
                let remainingPoints = 6;
        
                html.find('.plus-btn').click(ev => {
                    const skillValueElem = $(ev.currentTarget).siblings('.skill-value');
                    let skillValue = parseInt(skillValueElem.text());
        
                    if (remainingPoints >= skillValue + 1 && skillValue < 3) {
                        skillValue++;
                        remainingPoints -= skillValue;
                        skillValueElem.text(skillValue);
                    }
                });
        
                html.find('.minus-btn').click(ev => {
                    const skillValueElem = $(ev.currentTarget).siblings('.skill-value');
                    let skillValue = parseInt(skillValueElem.text());
        
                    if (skillValue > 0) {
                        remainingPoints += skillValue;
                        skillValue--;
                        skillValueElem.text(skillValue);
                    }
                });
            }
        }).render(true)
    }

    __updateSkills(skillUpdates) {
        let updateData = {};

        // set every skill mod to 0
        for (let skill in this.actor.system.skills) {
            updateData[`system.skills.${skill}.mod`] = 0;
        }

        for (let skill in skillUpdates) {
            updateData[`system.skills.${skill}.mod`] = skillUpdates[skill];
            updateData[`system.skills.${skill}.mod`] = skillUpdates[skill];
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