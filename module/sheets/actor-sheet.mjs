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
                this._onSelectClass();
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

    _onSelectClass() {
        // Dialog to select class and skill improvements
        new Dialog({
            title: 'Class Selection',
            content: `
            <form class="flexcol">
                <span class="warning">WARNING!</span> Your character will be overwritten, if you change your class!
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

                        this._selectClass(characterClass);

                        if (characterClass == 'rogue') {
                            this._onSelectRogueSkills();
                        } else {
                            this._onSelectTwoSkills();
                        }
                    }
                },
            },
            default: 'yes'
        }).render(true)
    }

    async _selectClass(className) {
        // roll health
        const rollFormular = OSR.classes[className].hitDie + "+@con.mod";
        const hp = await Utils.getRollResult(rollFormular, this.actor);

        let updateData = {
            "system.class.value": className,
            "system.level": 1,
            "system.resources.hitDie.value": OSR.classes[className].hitDie,
            "system.resources.health.value": hp,
            "system.resources.health.max": hp,
            "system.resources.health.initialized": 1
        };
        
        // add class specific starting equipment
        const equipment = OSR.classes[className].equipment;
        
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

    _onSelectTwoSkills() {
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
                        this._selectSkillImprovements("random", "random");
                    }
                },
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Confirm',
                    callback: (html) => {
                        let skillImprovement1 = html.find('[name="skillSelection1"]').val();
                        let skillImprovement2 = html.find('[name="skillSelection2"]').val();

                        this._selectSkillImprovements(skillImprovement1, skillImprovement2);
                    }
                },
            },
            default: 'yes'
        }).render(true)
    }

    _selectSkillImprovements(improvement1, improvement2) {
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

    _onSelectRogueSkills() {
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

                        this._updateSkills(skillUpdates);
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

    _updateSkills(skillUpdates) {
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

        if (dataset.type == 'check') {
            this._onRollCheck(dataset);
        } else if (dataset.type == 'save') {
            this._onRollSave(dataset);
        } else if (dataset.roll) {
            // Render the roll
            Utils.renderRoll(dataset, this.actor);
        }
    }

    _onRollCheck(dataset) {
        // Dialog to roll a check and set modifiers
        new Dialog({
            title: 'Skill Check',
            content: `
            <form class="flexcol">
                <div class="grid-2col">
                    <div>
                        <label for="abilitySelection">Ability</label>
                        <select name="abilitySelection">
                            <option value="">None</option>
                            <option value="cha">Charisma</option>
                            <option value="con">Constitution</option>
                            <option value="dex">Dexterity</option>
                            <option value="int">Intelligence</option>
                            <option value="str">Strength</option>
                            <option value="wis">Wisdom</option>
                        </select>
                    </div>
                    <div>
                        <label for="skillSelection">Skill</label>
                        <select name="skillSelection">
                            <option value="">None</option>
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
                <div class="skill-row">
                    <label for="mod-value">additional Modifiers: </label>
                    <button class="minus-btn">-</button>
                    <span class="mod-value">0</span>
                    <button class="plus-btn">+</button>
                <div>
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
                        let abilitySelection = html.find('[name="abilitySelection"]').val();
                        let skillSelection = html.find('[name="skillSelection"]').val();
                        let additionalModifiers = parseInt(html.find('.mod-value').text().trim());

                        // get abilities and skills
                        let ability = abilitySelection ? this.actor.system.abilities[abilitySelection] : 0;
                        let skill = skillSelection ? this.actor.system.skills[skillSelection] : 0;

                        dataset.roll = "1d6";

                        if (abilitySelection && skillSelection) {
                            dataset.label = ability.label + " and " + skill.label + " check";
                            dataset.roll +=  "+" + ability.mod + "+" + skill.mod;
                        } else if (abilitySelection) {
                            dataset.label = ability.label + " check";
                            dataset.roll += "+" + ability.mod;
                        } else if (skillSelection) {
                            dataset.label = skill.label + " check";
                            dataset.roll += "+" + skill.mod;
                        } else {
                            dataset.label = "straight check";
                        }

                        if (additionalModifiers) {
                            dataset.roll += "+" + additionalModifiers;
                        }

                        Utils.renderRoll(dataset, this.actor);
                    }
                },
            },
            default: 'yes',
            render: html => {
                html.find('.plus-btn').click(ev => {
                    const modValueElem = $(ev.currentTarget).siblings('.mod-value');
                    let modValue = parseInt(modValueElem.text()) + 1;
                    modValueElem.text(modValue);
                });
        
                html.find('.minus-btn').click(ev => {
                    const modValueElem = $(ev.currentTarget).siblings('.mod-value');
                    let modValue = parseInt(modValueElem.text()) - 1;
                    modValueElem.text(modValue);
                });

                if (dataset.ability) {
                    html.find('[name="abilitySelection"]').val(dataset.ability);
                }
                if (dataset.skill) {
                    html.find('[name="skillSelection"]').val(dataset.skill);
                }
            }
        }).render(true)
    }

    // TODO: add auto fail/ success
    _onRollSave(dataset) {
        // Dialog to roll a save
        new Dialog({
            title: 'Saving Throw',
            content: `
            <form class="flexcol">
                <div>
                    <label for="abilitySelection">Ability</label>
                    <select name="abilitySelection">
                        <option value="">None</option>
                        <option value="cha">Charisma</option>
                        <option value="con">Constitution</option>
                        <option value="dex">Dexterity</option>
                        <option value="int">Intelligence</option>
                        <option value="str">Strength</option>
                        <option value="wis">Wisdom</option>
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
                        let abilitySelection = html.find('[name="abilitySelection"]').val();
                        let ability = this.actor.system.abilities[abilitySelection];
                        
                        dataset.label = ability.label + " save";
                        dataset.roll = "1d10+" + ability.mod;

                        Utils.renderRoll(dataset, this.actor);
                    }
                },
            },
            default: 'yes',
            render: html => {
                if (dataset.ability) {
                    html.find('[name="abilitySelection"]').val(dataset.ability);
                }
            }
        }).render(true)
    }
}