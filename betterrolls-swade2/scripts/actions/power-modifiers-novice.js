/// power modifiers for novice powers ...

// TODO ... add limit by characters current Rank to the various Size modifiers in Shape Change
// TODO ... add radio button for any Area of Effect selection, e.g. Entangle
// TODO ... handle the additional modifiers in Summon Ally; Additional Allies, Combat Edge & Increased Trait, rather than use the crude "spend x PP's" buttons

/*
  format of power modifier elements ...
    name: "xxxxx", // text for line in damage roll details, currently NOT translated
    button_name: "BRSW.xxxxx", // button text in modal dialog, is translated
    { selector_type: "item_name", selector_value: "xxxxx" }           // "item_name"      is currently NOT translated
    { selector_type: "actor_has_edge", selector_value: "BRSW.xxxxx" } // "actor_has_edge" is translated
    group: "BRSW.xxxxx"

    { selector_type: "actor_has_edge", selector_value: "BRSW.EdgeName-Epic-Mastery" }
*/

export const POWER_MODIFIERS_NOVICE = [
  // ADDITIONALRECIPIENTS
  // NOTE: rather than have each power with the additional recipients have its own set of buttons, centralise it to this block
  {
    id: "POWERADDITIONALRECIPIENTS1",
    name: "Power",
    button_name: "BRSW.PowerModifiersGenericAdditionalRecipients1",
    shotsUsed: "+1",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      {
        or_selector: [
          {
            selector_type: "item_name", selector_value: "Arcane Protection",
          },
          {
            selector_type: "item_name", selector_value: "Boost",
          },
          {
            selector_type: "item_name", selector_value: "Burrow",
          },
          {
            selector_type: "item_name", selector_value: "Environmental Protection",
          },
          {
            selector_type: "item_name", selector_value: "Relief",
          },
          {
            selector_type: "item_name", selector_value: "Protection",
          },
          {
            selector_type: "item_name", selector_value: "Wall Walker",
          }
        ],
      }
    ],
    group: "BRSW.PowerModifiersGenericAdditionalRecipients"
  },
  {
    id: "POWERADDITIONALRECIPIENTS2",
    name: "Power",
    button_name: "BRSW.PowerModifiersGenericAdditionalRecipients2",
    shotsUsed: "+2",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      {
        or_selector: [
          {
            selector_type: "item_name", selector_value: "Arcane Protection",
          },
          {
            selector_type: "item_name", selector_value: "Boost",
          },
          {
            selector_type: "item_name", selector_value: "Burrow",
          },
          {
            selector_type: "item_name", selector_value: "Environmental Protection",
          },
          {
            selector_type: "item_name", selector_value: "Relief",
          },
          {
            selector_type: "item_name", selector_value: "Protection",
          },
          {
            selector_type: "item_name", selector_value: "Wall Walker",
          }
        ],
      }
    ],
    group: "BRSW.PowerModifiersGenericAdditionalRecipients"
  },
  {
    id: "POWERADDITIONALRECIPIENTS3",
    name: "Power",
    button_name: "BRSW.PowerModifiersGenericAdditionalRecipients3",
    shotsUsed: "+3",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      {
        or_selector: [
          {
            selector_type: "item_name", selector_value: "Arcane Protection",
          },
          {
            selector_type: "item_name", selector_value: "Boost",
          },
          {
            selector_type: "item_name", selector_value: "Burrow",
          },
          {
            selector_type: "item_name", selector_value: "Environmental Protection",
          },
          {
            selector_type: "item_name", selector_value: "Relief",
          },
          {
            selector_type: "item_name", selector_value: "Protection",
          },
          {
            selector_type: "item_name", selector_value: "Wall Walker",
          }
        ],
      }
    ],
    group: "BRSW.PowerModifiersGenericAdditionalRecipients"
  },
  {
    id: "POWERADDITIONALRECIPIENTS4",
    name: "Power",
    button_name: "BRSW.PowerModifiersGenericAdditionalRecipients4",
    shotsUsed: "+4",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      {
        or_selector: [
          {
            selector_type: "item_name", selector_value: "Arcane Protection",
          },
          {
            selector_type: "item_name", selector_value: "Boost",
          },
          {
            selector_type: "item_name", selector_value: "Burrow",
          },
          {
            selector_type: "item_name", selector_value: "Environmental Protection",
          },
          {
            selector_type: "item_name", selector_value: "Relief",
          },
          {
            selector_type: "item_name", selector_value: "Protection",
          },
          {
            selector_type: "item_name", selector_value: "Wall Walker",
          }
        ],
      }
    ],
    group: "BRSW.PowerModifiersGenericAdditionalRecipients"
  },
  {
    id: "POWERADDITIONALRECIPIENTS5",
    name: "Power",
    button_name: "BRSW.PowerModifiersGenericAdditionalRecipients5",
    shotsUsed: "+5",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      {
        or_selector: [
          {
            selector_type: "item_name", selector_value: "Arcane Protection",
          },
          {
            selector_type: "item_name", selector_value: "Boost",
          },
          {
            selector_type: "item_name", selector_value: "Burrow",
          },
          {
            selector_type: "item_name", selector_value: "Environmental Protection",
          },
          {
            selector_type: "item_name", selector_value: "Relief",
          },
          {
            selector_type: "item_name", selector_value: "Protection",
          },
          {
            selector_type: "item_name", selector_value: "Wall Walker",
          }
        ],
      }
    ],
    group: "BRSW.PowerModifiersGenericAdditionalRecipients"
  },

  // ARCANE PROTECTION
  // plus Additional Recipients, which is handled by the generic clause above
  {
    id: "POWERARCANEPROTECTIONGREATER",
    name: "Greater Arcane Protection",
    button_name: "BRSW.PowerModifiersArcaneProtectionGreater",
    shotsUsed: "+2",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Arcane Protection" },
      { selector_type: "actor_has_edge", selector_value: "BRSW.EdgeName-Epic-Mastery" }
    ],
    group: "BRSW.PowerModifiersArcaneProtection"
  },

  // BEAST FRIEND
  {
    id: "POWERBEASTFRIENDMODBESTIARIUM",
    name: "☆ Beastarium",
    button_name: "BRSW.PowerModifiersBeastFriendBeastarium",
    shotsUsed: "+2",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Beast Friend" },
      { selector_type: "actor_has_edge", selector_value: "BRSW.EdgeName-Epic-Mastery" }
    ],
    group: "BRSW.PowerModifiersBeastFriend"
  },
  {
    id: "POWERBEASTFRIENDMODDURATION",
    name: "Duration (+1)",
    button_name: "Duration (+1)",
    shotsUsed: "+1",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Beast Friend" }
    ],
    group: "BRSW.PowerModifiersBeastFriend"
  },
  {
    id: "POWERBEASTFRIENDMODMINDRIDER",
    name: "Mind Rider (+1)",
    button_name: "Mind Rider (+1)",
    shotsUsed: "+1",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Beast Friend" }
    ],
    group: "BRSW.PowerModifiersBeastFriend"
  },

  // BOLT
  {
    id: "POWERBOLTMODDAMAGE",
    name: "Damage (+1d6)",
    button_name: "BRSW.PowerModifiersBoltDamage",
    shotsUsed: "+2",
    dmgMod: "+d6x",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Bolt" }
    ],
    group: "BRSW.PowerModifiersBolt"
  },
  {
    id: "POWERBOLTMODDISINTEGRATE",
    name: "Disintegrate",
    button_name: "BRSW.PowerModifiersBoltDisintegrate",
    shotsUsed: "+2",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Bolt" },
      { selector_type: "actor_has_edge", selector_value: "BRSW.EdgeName-Epic-Mastery" }
    ],
    group: "BRSW.PowerModifiersBolt"
  },
  {
    id: "POWERBOLTMODGREATERBOLT",
    name: "Greater Bolt (+2d6)",
    button_name: "BRSW.PowerModifiersBoltGreaterBolt",
    shotsUsed: "+4",
    dmgMod: "+2d6x",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Bolt" },
      { selector_type: "actor_has_edge", selector_value: "BRSW.EdgeName-Epic-Mastery" }
    ],
    group: "BRSW.PowerModifiersBolt"
  },
  {
    id: "POWERBOLTMODRATEOFFIRE",
    name: "Rate of Fire",
    button_name: "BRSW.PowerModifiersBoltRateOfFire",
    shotsUsed: "+2",
    rof: "2",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Bolt" },
      { selector_type: "actor_has_edge", selector_value: "BRSW.EdgeName-Epic-Mastery" }
    ],
    group: "BRSW.PowerModifiersBolt"
  },

  // BOOST/LOWER TRAIT
  // plus Additional Recipients, which is handled by the generic clause above
  {
    id: "POWERBOOSTLOWERTRAITMOGREATER",
    name: "Greater Boost/Lower Trait",
    button_name: "BRSW.PowerModifiersBoostLowerGreater",
    shotsUsed: "+2",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Boost/Lower Trait" },
      { selector_type: "actor_has_edge", selector_value: "BRSW.EdgeName-Epic-Mastery" }
    ],
    group: "BRSW.PowerModifiersBoostLower"
  },
  {
    id: "POWERBOOSTLOWERTRAITMODSTRONG",
    name: "Strong (+1)",
    button_name: "BRSW.PowerModifiersBoostLowerStrong",
    shotsUsed: "+1",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Boost/Lower Trait" }
    ],
    group: "BRSW.PowerModifiersBoostLower"
  },

  // BURROW
  // plus Additional Recipients, which is handled by the generic clause above
  {
    id: "POWERBURROWMODPOWER",
    name: "Power",
    button_name: "BRSW.PowerModifiersBurrowPower",
    shotsUsed: "+1",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Burrow" }
    ],
    group: "BRSW.PowerModifiersBurrow"
  },

  // BURST
  {
    id: "POWERBURSTMODDAMAGE",
    name: "Damage (+2d6)",
    button_name: "BRSW.PowerModifiersBurstDamage",
    shotsUsed: "+2",
    dmgMod: "+d6x",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Burst" }
    ],
    group: "BRSW.PowerModifiersBurst"
  },
  {
    id: "POWERBURSTMODGREATERBURST",
    name: "Greater Burst (+2d6)",
    button_name: "BRSW.PowerModifiersBurstGreaterBurst",
    shotsUsed: "+4",
    dmgMod: "+2d6x",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Burst" },
      { selector_type: "actor_has_edge", selector_value: "BRSW.EdgeName-Epic-Mastery" }
    ],
    group: "BRSW.PowerModifiersBurst"
  },
  {
    id: "POWERBURSTPUSH",
    name: "Push (2d6 feet)",
    button_name: "BRSW.PowerModifiersBurstPush",
    shotsUsed: "+1",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Burst" }
    ],
    group: "BRSW.PowerModifiersBurst"
  },

  // DISPEL

  // DEFLECTION

  // ENTANGLE
  {
    id: "POWERENTANGLEMODMEDIUM",
    name: "Medium (LBT)",
    button_name: "BRSW.PowerModifiersEntangleAreaEffectMBT",
    shotsUsed: "+2",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Entangle" }
    ],
    group: "BRSW.PowerModifiersEntangle"
  },
  {
    id: "POWERENTANGLEMODLARGE",
    name: "Large or Stream (+3)",
    button_name: "BRSW.PowerModifiersEntangleAreaEffectLBTStream",
    shotsUsed: "+3",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Entangle" }
    ],
    group: "BRSW.PowerModifiersEntangle"
  },
  {
    id: "POWERENTANGLEMODDAMAGE",
    name: "Damage (+2)",
    button_name: "BRSW.PowerModifiersEntangleDamage",
    shotsUsed: "+2",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Entangle" }
    ],
    group: "BRSW.PowerModifiersEntangle"
  },
  {
    id: "POWERENTANGLEMODDEADLY",
    name: "☆ Deadly (+4)",
    button_name: "BRSW.PowerModifiersEntangleDeadly",
    shotsUsed: "+4",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Entangle" },
      { selector_type: "actor_has_edge", selector_value: "BRSW.EdgeName-Epic-Mastery" }
    ],
    group: "BRSW.PowerModifiersEntangle"
  },
  {
    id: "POWERENTANGLEMODTOUGH",
    name: "Tough (+1)",
    button_name: "BRSW.PowerModifiersEntangleTough",
    shotsUsed: "+1",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Entangle" }
    ],
    group: "BRSW.PowerModifiersEntangle"
  },

  // ENVIRONMENTAL PROTECTION
  {
    id: "POWERENVPROTECTIONMODRESISTANCE",
    name: "Environmental Resistance",
    button_name: "BRSW.PowerModifiersEnvironmentalProtectionEnvironmentalResistance",
    shotsUsed: "+1",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Environmental Protection" }
    ],
    group: "BRSW.PowerModifiersEnvironmentalProtection"
  },

  // HAVOC
  {
    id: "POWERHAVOCMODGREATER",
    name: "Greater Havoc (+2d6)",
    button_name: "BRSW.PowerModifiersHavocGreaterHavoc",
    shotsUsed: "+2",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Havoc" },
      { selector_type: "actor_has_edge", selector_value: "BRSW.EdgeName-Epic-Mastery" }
    ],
    group: "BRSW.PowerModifiersHavoc"
  },
  {
    id: "POWERHAVOCMODAREA",
    name: "Area Effect (LBT)",
    button_name: "BRSW.PowerModifiersHavocAreaEffect",
    shotsUsed: "+1",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Havoc" }
    ],
    group: "BRSW.PowerModifiersHavoc"
  },

  // HEALING
  {
    id: "POWERHEALINGMODGREATERHEALING",
    name: "Greater Healing",
    button_name: "BRSW.PowerModifiersHealingGreaterHealing",
    shotsUsed: "+10",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Healing" }
    ],
    group: "BRSW.PowerModifiersHealing"
  },
  {
    id: "POWERHEALINGMODCRIPPLINGINJURIES",
    name: "Crippling Injuries",
    button_name: "BRSW.PowerModifiersHealingCripplingInjuries",
    shotsUsed: "+20",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Healing" }
    ],
    group: "BRSW.PowerModifiersHealing"
  },
  {
    id: "POWERHEALINGMODMASSHEALINGMEDIUMBLAST",
    name: "Mass Healing - MBT",
    button_name: "BRSW.PowerModifiersHealingMassHealingMBT",
    shotsUsed: "+2",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Healing" },
      { selector_type: "actor_has_edge", selector_value: "BRSW.EdgeName-Epic-Mastery" }
    ],
    group: "BRSW.PowerModifiersHealing"
  },
  {
    id: "POWERHEALINGMODMASSHEALINGLARGEBLAST",
    name: "Mass Healing - LBT",
    button_name: "BRSW.PowerModifiersHealingMassHealingLBT",
    shotsUsed: "+3",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Healing" },
      { selector_type: "actor_has_edge", selector_value: "BRSW.EdgeName-Epic-Mastery" }
    ],
    group: "BRSW.PowerModifiersHealing"
  },
  {
    id: "POWERHEALINGMODNEUTRALIZEPOISON",
    name: "Neutralize Poison or Disease",
    button_name: "BRSW.PowerModifiersHealingNeutralisePoisonOrDisease",
    shotsUsed: "+1",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Healing" }
    ],
    group: "BRSW.PowerModifiersHealing"
  },

  // PROTECTION
  // ... is just Additional Recipients, which is handled by the generic clause above

  // RELIEF
  // plus Additional Recipients, which is handled by the generic clause above
  {
    id: "POWERRELIEFMODRESTORATION",
    name: "Restoration",
    button_name: "BRSW.PowerModifiersReliefRestoration",
    shotsUsed: "+3",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Relief" }
    ],
    group: "BRSW.PowerModifiersRelief"
  },
  {
    id: "POWERRELIEFMODSTUNNED",
    name: "Stunned",
    button_name: "BRSW.PowerModifiersReliefStunned",
    shotsUsed: "+1",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Relief" }
    ],
    group: "BRSW.PowerModifiersRelief"
  },

  // SANCTUARY
  {
    id: "POWERSANCTUARYMODSTRONG",
    name: "☆ Strong",
    button_name: "BRSW.PowerModifiersSanctuaryStrong",
    shotsUsed: "+1",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Sanctuary" },
      { selector_type: "actor_has_edge", selector_value: "BRSW.EdgeName-Epic-Mastery" }
    ],
    group: "BRSW.PowerModifiersSanctuary"
  },
  {
    id: "POWERSANCTUARYMODMEDIUMBLAST",
    name: "Medium Blast",
    button_name: "BRSW.PowerModifiersSanctuaryAreaEffectMBT",
    shotsUsed: "+2",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Sanctuary" }
    ],
    group: "BRSW.PowerModifiersSanctuary"
  },
  {
    id: "POWERSANCTUARYMODLARGEBLAST",
    name: "Large Blast",
    button_name: "BRSW.PowerModifiersSanctuaryAreaEffectLBT",
    shotsUsed: "+3",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Sanctuary" }
    ],
    group: "BRSW.PowerModifiersSanctuary"
  },

  // SHAPE CHANGE
  // plus Additional Recipients, which is handled by the generic clause above
  {
    id: "POWERSHAPECHANGEMODDURATION",
    name: "Duration",
    button_name: "BRSW.PowerModifiersShapeChangeDuration",
    shotsUsed: "+1",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Shape Change" }
    ],
    group: "BRSW.PowerModifiersShapeChange"
  },
  {
    id: "POWERSHAPECHANGEMODTRANSFORMTOUCH",
    name: "☆ Transform (Touch)",
    button_name: "BRSW.PowerModifiersShapeChangeTransformTouch",
    shotsUsed: "+2",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Shape Change" },
      { selector_type: "actor_has_edge", selector_value: "BRSW.EdgeName-Epic-Mastery" }
    ],
    group: "BRSW.PowerModifiersShapeChange"
  },
  {
    id: "POWERSHAPECHANGEMODTRANSFORMRANGE",
    name: "☆ Transform (Range)",
    button_name: "BRSW.PowerModifiersShapeChangeTransformRange",
    shotsUsed: "+3",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Shape Change" },
      { selector_type: "actor_has_edge", selector_value: "BRSW.EdgeName-Epic-Mastery" }
    ],
    group: "BRSW.PowerModifiersShapeChange"
  },
  {
    id: "POWERSHAPECHANGEMODPOLYMORPH",
    name: "☆ Polymorph (+3)",
    button_name: "BRSW.PowerModifiersShapeChangePolymorph",
    shotsUsed: "+3",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Shape Change" },
      { selector_type: "actor_has_edge", selector_value: "BRSW.EdgeName-Epic-Mastery" }
    ],
    group: "BRSW.PowerModifiersShapeChange"
  },
  {
    id: "POWERSHAPECHANGEMODSIZE-4",
    name: "Size -4 to -1",
    button_name: "BRSW.PowerModifiersShapeChangeSize-4to-1",
    shotsUsed: "3",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Shape Change" }
    ],
    group: "BRSW.PowerModifiersShapeChange",
    defaultChecked: "on"
  },
  {
    id: "POWERSHAPECHANGEMODSIZE0",
    name: "Size 0",
    button_name: "BRSW.PowerModifiersShapeChangeSize0",
    shotsUsed: "5",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Shape Change" }
    ],
    group: "BRSW.PowerModifiersShapeChange"
  },
  {
    id: "POWERSHAPECHANGEMODSIZE1",
    name: "Size 1 to 2",
    button_name: "BRSW.PowerModifiersShapeChangeSize1to2",
    shotsUsed: "8",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Shape Change" }
    ],
    group: "BRSW.PowerModifiersShapeChange"
  },
  {
    id: "POWERSHAPECHANGEMODSIZE3",
    name: "Size 3 to 4",
    button_name: "BRSW.PowerModifiersShapeChangeSize3to4",
    shotsUsed: "11",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Shape Change" }
    ],
    group: "BRSW.PowerModifiersShapeChange"
  },
  {
    id: "POWERSHAPECHANGEMODSIZE5",
    name: "Size 5 to 10",
    button_name: "BRSW.PowerModifiersShapeChangeSize5to10",
    shotsUsed: "15",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Shape Change" }
    ],
    group: "BRSW.PowerModifiersShapeChange"
  },

  // STUN

  // SUMMON ALLY
  {
    id: "POWERSUMMONALLYMODNOVICE",
    name: "Novice",
    button_name: "BRSW.PowerModifiersSummonAlly1Novice",
    shotsUsed: "1",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Summon Ally" }
    ],
    group: "BRSW.PowerModifiersSummonAllyRank"
  },
  {
    id: "POWERSUMMONALLYMODSEASONED",
    name: "Seasoned",
    button_name: "BRSW.PowerModifiersSummonAlly2Seasoned",
    shotsUsed: "3",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Summon Ally" },
      {
        or_selector: [
          {
            selector_type: "actor_value", selector_value: "system.advances.rank=Seasoned",
          },
          {
            selector_type: "actor_value", selector_value: "system.advances.rank=Veteran",
          },
          {
            selector_type: "actor_value", selector_value: "system.advances.rank=Heroic",
          },
          {
            selector_type: "actor_value", selector_value: "system.advances.rank=Legendary",
          }
        ],
      }
    ],
    group: "BRSW.PowerModifiersSummonAllyRank"
  },
  {
    id: "POWERSUMMONALLYMODVETERAN",
    name: "Veteran",
    button_name: "BRSW.PowerModifiersSummonAlly3Veteran",
    shotsUsed: "5",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Summon Ally" },
      {
        or_selector: [
          {
            selector_type: "actor_value", selector_value: "system.advances.rank=Veteran",
          },
          {
            selector_type: "actor_value", selector_value: "system.advances.rank=Heroic",
          },
          {
            selector_type: "actor_value", selector_value: "system.advances.rank=Legendary",
          }
        ],
      }
    ],
    group: "BRSW.PowerModifiersSummonAllyRank"
  },
  {
    id: "POWERSUMMONALLYMODHEROIC",
    name: "Heroic",
    button_name: "BRSW.PowerModifiersSummonAlly4Heroic",
    shotsUsed: "7",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Summon Ally" },
      {
        or_selector: [
          {
            selector_type: "actor_value", selector_value: "system.advances.rank=Heroic",
          },
          {
            selector_type: "actor_value", selector_value: "system.advances.rank=Legendary",
          }
        ],
      }
    ],
    group: "BRSW.PowerModifiersSummonAllyRank"
  },
  {
    id: "POWERSUMMONALLYMODMINDRIDER",
    name: "Mind Rider",
    button_name: "BRSW.PowerModifiersSummonAllyMindRider",
    shotsUsed: "+1",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Summon Ally" }
    ],
    group: "BRSW.PowerModifiersSummonAlly"
  },
  {
    id: "POWERSUMMONALLYMODFLIGHT",
    name: "Flight",
    button_name: "BRSW.PowerModifiersSummonAllyFlight",
    shotsUsed: "+1",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Summon Ally" }
    ],
    group: "BRSW.PowerModifiersSummonAlly"
  },
  {
    id: "POWERSUMMONALLYMODADDITIONALALLIES",
    name: "Additional Allies",
    button_name: "BRSW.PowerModifiersSummonAllyAdditionalAllies",
    shotsUsed: "+0",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Summon Ally" },
      { selector_type: "actor_has_edge", selector_value: "BRSW.EdgeName-Epic-Mastery" }
    ],
    group: "BRSW.PowerModifiersSummonAlly"
  },
  {
    id: "POWERSUMMONALLYMODCOMBATEDGE",
    name: "Combat Edge",
    button_name: "BRSW.PowerModifiersSummonAllyCombatEdge",
    shotsUsed: "+0",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Summon Ally" }
    ],
    group: "BRSW.PowerModifiersSummonAlly"
  },
  {
    id: "POWERSUMMONALLYMODINCREASEDTRAIT",
    name: "Increased Trait",
    button_name: "BRSW.PowerModifiersSummonAllyIncreasedTrait",
    shotsUsed: "+0",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Summon Ally" }
    ],
    group: "BRSW.PowerModifiersSummonAlly"
  },

  // WALL WALKER
  // ... is just Additional Recipients, which is handled by the generic clause above
];
