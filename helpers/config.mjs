export const OSR = {};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
OSR.abilities = {
  cha: 'OSR.Ability.Cha.long',
  con: 'OSR.Ability.Con.long',
  dex: 'OSR.Ability.Dex.long',
  int: 'OSR.Ability.Int.long',
  str: 'OSR.Ability.Str.long',
  wis: 'OSR.Ability.Wis.long',
};
  
OSR.abilityAbbreviations = {
  cha: 'OSR.Ability.Cha.short',
  con: 'OSR.Ability.Con.short',
  dex: 'OSR.Ability.Dex.short',
  int: 'OSR.Ability.Int.short',
  str: 'OSR.Ability.Str.short',
  wis: 'OSR.Ability.Wis.short',
};

OSR.skills = {
  arcana: 'OSR.Skill.Arcana',
  climbing: 'OSR.Skill.Climbing',
  firstAid: 'OSR.Skill.FirstAid',
  literacy: 'OSR.Skill.Literacy',
  seamanship: 'OSR.Skill.Seamanship',
  search: 'OSR.Skill.Search',
  sleightOfHand: 'OSR.Skill.SleightOfHand',
  stealth: 'OSR.Skill.Stealth',
  survival: 'OSR.Skill.Survival',
  tinkering: 'OSR.Skill.Tinkering',
};

OSR.classes = {
  "unassigned": {
    label: 'OSR.Classes.Unassigned',
    hitDie: '1d1',
    features: [],
    levels: []
  },
  "rogue": {
    label: 'OSR.Classes.Rogue',
    hitDie: '1d6',
    features: [
      "Rogue.Luck", "Rogue.SneakAttack"
    ],
    levels: [
      {
        saving_throw_increases: {
          dex: 1,
          int: 1
        },
        bab: 1,
        skills: {
          stealth: 1
        }
      }
    ],
    equipment: {
      "weapons": [
        {
          name: 'Short Sword',
          damage: '1d6',
          notes: ''
        },
        {
          name: 'Shortbow',
          damage: '1d6',
          notes: '60` range, requires arrows'
        }
      ],
      "armor": [
        {
          name: 'Leather Armor',
          mod: 2,
          notes: ''
        }
      ],
      "items": [
        {
          description: 'a quiver of arrows (scarcity check per combat scene used)',
          scarcityDie: '1d8'
        }
      ]
    }
  },
  sorcerer: {
    label: 'OSR.Classes.Sorcerer',
    hitDie: '1d4',
    features: [
      "Sorcerer.BloodMagic"
    ],
    levels: [
      {
        saving_throw_increases: {
          cha: 1,
          wis: 1
        },
        bab: 1,
        skills: {
          literacy: 1
        }
      }
    ],
    equipment: {
      "weapons": [
        {
          name: 'Ritual Dagger',
          damage: '1d4',
          notes: '-4 to hit; 1 shock when used by Sorcerers'
        },
        {
          name: 'Staff',
          damage: '1d6',
          notes: 'two-handed'
        }
      ]
    }
  },
  warrior: {
    label: 'OSR.Classes.Warrior',
    hitDie: '1d8',
    features: [
      "Warrior.CombatReflexes", "Warrior.BattleIntuition"
    ],
    levels: [
      {
        saving_throw_increases: {
          con: 1,
          str: 1
        },
        bab: 2,
        skills: {}
      }
    ],
    equipment: {
      "weapons": [
        {
          name: 'Mace or Sword',
          damage: '1d8',
          notes: ''
        },
        {
          name: 'Shortbow',
          damage: '1d6',
          notes: '60` range, requires arrows'
        }
      ],
      "armor": [
        {
          name: 'Leather Armor',
          mod: 2,
          notes: ''
        }
      ],
      "items": [
        {
          description: 'a quiver of arrows (scarcity check per combat scene used)',
          scarcityDie: '1d8'
        }
      ]
    }
  }
};

OSR.startingEquipment = [
  {
    description: 'common cloths (takes up no item slots when worn)',
    scarcityDie: ''
  },
  {
    description: 'backpack (adds 4 item slots, -2 for stealth checks)',
    scarcityDie: ''
  },
  {
    description: 'coin pouch (holds 100 coins)',
    scarcityDie: ''
  },
  {
    description: 'pilgrim\'s case (tinder set, mug, plate, cutlery, small pot, fire grate)',
    scarcityDie: ''
  },
  {
    description: 'bedroll (allows restfull sleep outdoors)',
    scarcityDie: ''
  },
  {
    description: 'rations (scarcity check each day whether eaten or not)',
    scarcityDie: '1d4'
  },
  {
    description: 'waterskin (scarcity check per day used, can be refilled at a clean water source)',
    scarcityDie: '1d8'
  }
]

OSR.abilityModifiers = {
    3: -3,
    4: -2,
    5: -2,
    6: -1,
    7: -1,
    8: -1,
    9:  0,
    10: 0,
    11: 0,
    12: 0,
    13: 1,
    14: 1,
    15: 1,
    16: 2,
    17: 2,
    18: 3,
  }