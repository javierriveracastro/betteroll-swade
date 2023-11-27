//
// target actions, i.e. where the target has some sort of effect, such as Dodge edge, Deflection power, or Shroud generic power modifier
//

/*
  format of target actions ...
    id: "xxxxx"                // unique id for the actions, sets the sort order of the action
    name: "xxxxx",             // text for line in damage roll details, currently NOT translated
    button_name: "BRSW.xxxxx", // button text in modal dialog, is translated. Actual text comes from the en.json file
    { selector_type: "item_name", selector_value: "xxxxx" }          // "item_name"         is currently NOT translated
    { selector_type: "target_has_effect", selector_value: "xxxxx" }  // "target_has_effect" is currently NOT translated
    group: "BRSW.xxxxx"        // again actual text comes from the en.json file
*/

//
// NOTE: The actions using the "target_has_effect" selector are opinionated in the name of the effect.
// NOTE: The suffixes of "weapon" and "power" refer to the source of the "attack" on the target, i.e. physical weapons and arcane powers.
// NOTE: There is a question on the logic for actions where the skillMod of a power is reduced.
//       Currently this means the activation fails, so the cost is 1 PP. 
//       But in the rules, the power is activated, 
//       e.g., a Bolt that misses because the target has Deflection, is still activated on a 4 or greater, it just needs a 6 or greater to hit the target.
// NOTE: There are likely to be conflicts with the SWIM module, as it adds some world actions in its brsw_actions_setup.js, but if we take a dependency on SWIM, we end up with a circular dependency
//

export const TARGET_ACTIONS = [
  // DODGE EDGE ... Subtracts 2 from all ranged attacks.
  // TODO ... Look at how a skillMod -2/-4 affects the activation, as the power will activate on a 4 result, ignoring the -2/-4 imposed by Arcane Protection.
  //      ... It will just fail to affect the target. 
  {
    id: "TARGET-HAS-DODGE-POWERS",
    name: "TargetHasDodgePower",
    button_name: "has Dodge",
    skillMod: "-2",
    and_selector: [
      {
        selector_type: "target_has_edge",
        selector_value: "BRSW.EdgeName-Dodge", // NOTE this works because the global_actions.js expects the ... value.includes("BRSW.EdgeName-")
      },
      {
        selector_type: "item_type",
        selector_value: "power"
      },
    ],
    defaultChecked: "on",
    group: "BRSW.Target",
  },
  {
    id: "TARGET-HAS-DODGE-WEAPONS",
    name: "TargetHasDodgeWeapon",
    button_name: "has Dodge",
    skillMod: "-2",
    and_selector: [
      {
        selector_type: "item_type",
        selector_value: "weapon"
      },
      {
        selector_type: "target_has_edge",
        selector_value: "BRSW.EdgeName-Dodge",
      },
      {
        or_selector: [
          {
            selector_type: "skill",
            selector_value: "BRSW.SkillName-UnskilledAttempt"
          },
          {
            selector_type: "skill",
            selector_value: "BRSW.SkillName-Shooting"
          },
          {
            selector_type: "skill",
            selector_value: "BRSW.SkillName-Athletics"
          },
        ],
      },
    ],
    defaultChecked: "on",
    group: "BRSW.Target",
  },

  // ARCANE PROTECTION POWER
  // NOTE ... This action currently has NO actual effect, i.e, for now, it just shows a target has Arcane Protection.
  // NOTE ... The assumption is the target has an Active Effect named "Arcane Protection", which doesn't need any actual effect
  // TODO ... Look at how a skillMod -2/-4 affects the activation, as the power will activate on a 4 result, ignoring the -2/-4 imposed by Arcane Protection.
  //      ... It will just fail to affect the target.
  // TODO ... Add the skillMod -2 and handle the -4 for a raise.
  // TODO ... Add the skillMod -4 and -6 for the epic modifier Greater Arcane Protection.
  {
    id: "TARGET-HAS-ARCANE-PROTECTION",
    name: "TargetHasArcaneProtection",
    button_name: "has Arcane Protection",
    and_selector: [
      {
        selector_type: "target_has_effect",
        selector_value: "Arcane Protection"
      },
      {
        selector_type: "item_type",
        selector_value: "power"
      },
    ],
    defaultChecked: "on",
    group: "BRSW.Target",
  },

  // DEFLECTION POWER ... Subtracts 2 from either melee or ranged attacks
  // NOTE ... The assumption is the target has an Active Effect named "Deflection (melee)", which doesn't need any actual effect
  // TODO ... How to handle melee attacks when the attacker does NOT have "Fighting", so uses "Unskilled Attempt"
  {
    id: "TARGET-HAS-DEFLECTION-MELEE",
    name: "Deflection (melee)",
    button_name: "has Deflection (melee)",
    skillMod: -2,
    and_selector: [
      {
        selector_type: "target_has_effect",
        selector_value: "Deflection (melee)"
      },
      {
        selector_type: "item_type",
        selector_value: "weapon"
      },
      {
        selector_type: "skill",
        selector_value: "Fighting"
      },
      // TODO ...
      // {
      //   or_selector: [
      //     {
      //       selector_type: "skill",
      //       selector_value: "Fighting"
      //     },
      //     {
      //       selector_type: "skill",
      //       selector_value: "Unskilled Attempt"
      //     },
      //   ],
      // },
    ],
    defaultChecked: "on",
    group: "BRSW.Target",
  },
  // TODO ... Look at how a skillMod -2/-4 affects the power activation, really just Bolt, as it will activate on a 4 result, ignoring the -2/-4 imposed by Deflection.
  //      ... It will just fail to hit the target.
  // TODO ... How to handle melee attacks when the attacker does NOT have "Shooting", so uses "Unskilled Attempt" ... as every character has "Athletics"
  {
    id: "TARGET-HAS-DEFLECTION-RANGED",
    name: "TargetHasDeflectionRanged",
    button_name: "has Deflection (ranged)",
    skillMod: -2,
    and_selector: [
      {
        selector_type: "target_has_effect",
        selector_value: "Deflection (ranged)"
      },
      {
        selector_type: "item_type",
        selector_value: "weapon"
      },
      {
        or_selector: [
          {
            selector_type: "skill",
            selector_value: "BRSW.SkillName-Athletics"
          },
          {
            selector_type: "skill",
            selector_value: "BRSW.SkillName-Shooting"
          },
          // TODO ...
          // {
          //   selector_type: "skill",
          //   selector_value: "BRSW.SkillName-UnskilledAttempt"
          // },
        ],
      },
    ],
    defaultChecked: "on",
    group: "BRSW.Target",
  },

  // INVISIBILITY POWER ... Any action taken against him that requires sight is made at −4, or −6 with a raise.
  // NOTE ... The assumption is the target has an Active Effect named "Invisibility", which doesn't need any actual effect
  {
    id: "TARGET-HAS-INVISIBILITY",
    name: "TargetHasInvisibility",
    button_name: "has Invisibility",
    and_selector: [
      {
        selector_type: "target_has_effect",
        selector_value: "Invisibility"
      },
    ],
    defaultChecked: "on",
    group: "BRSW.Target",
  },

  // PROTECTION POWER
  // NOTE ... This action does NOT have any actual effect, i.e, it just shows a target has Protection. 
  // NOTE ... The assumption is the target has an Active Effect named "Protection", which has an increase to either Armour or Toughness, i.e.,
  //      ...   system.stats.toughness.armor Add 2  (with activation)
  //      ...   system.stats.toughness.value Add 2  (with raise)
  {
    id: "TARGET-HAS-PROTECTION",
    name: "TargetHasProtection",
    button_name: "has Protection",
    and_selector: [
      {
        selector_type: "target_has_effect",
        selector_value: "Protection"
      },
      {
        "not_selector": [
          {
            "selector_type": "target_has_effect",
            "selector_value": "Arcane Protection"
          }
        ]
      },
    ],
    defaultChecked: "on",
    group: "BRSW.Target",
  },

  // SANCTUARY POWER 
  // NOTE ... This action does NOT have any actual effect, i.e, it just shows a target has Sanctuary. 
  // NOTE ... The assumption is the target has an Active Effect named "Sanctuary", which doesn't need any actual effect
  // NOTE ... It does NOT handle the need to make a Spirit roll/-2 with Raise, or -2/-4 with epic Strong modifier
  {
    id: "TARGET-HAS-SANCTUARY",
    name: "TargetHasSanctuary",
    button_name: "has Sanctuary",
    selector_type: "target_has_effect",
    selector_value: "Sanctuary",
    defaultChecked: "on",
    group: "BRSW.Target",
  },

  // SHROUD GENERIC POWER MODIFIER ...
  // TODO ... Work out what the "attacks against her suffer a -1 penalty" actually covers, i.e. is it just weapons (melee & ranged), or also powers?
  {
    id: "TARGET-HAS-SHROUD-WEAPONS",
    name: "TargetHasShroudWeapon",
    button_name: "has Shroud",
    skillMod: "-1",
    and_selector: [
      {
        selector_type: "target_has_effect",
        selector_value: "Shroud",
      },
      {
        or_selector: [
          {
            selector_type: "item_type",
            selector_value: "weapon"
          },
          {
            selector_type: "item_type",
            selector_value: "power"
          },
        ],
      },],
    defaultChecked: "on",
    group: "BRSW.Target",
  },

];
