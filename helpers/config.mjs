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
    hitDie: 1,
    features: [],
    levels: []
  },
  "rogue": {
    label: 'OSR.Classes.Rogue',
    hitDie: 6,
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
    ]
  },
  sorcerer: {
    label: 'OSR.Classes.Sorcerer',
    hitDie: 4,
    features: [
      "Sorcerer.BloodMagic", "Sorcerer.Mend", "Sorcerer.Aid", "Sorcerer.Rend"
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
    ]
  },
  warrior: {
    label: 'OSR.Classes.Warrior',
    hitDie: 8,
    features: [
      "CombatReflexes, BattleIntuition"
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
    ]
  }
};

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