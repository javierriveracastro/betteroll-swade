/// power modifiers for novice powers ...

/*
  format of power modifier elements ...
    name: "xxxxx", // text for line in damage roll details, currently NOT translated
    button_name: "BRSW.xxxxx", // button text in modal dialog, is translated
    { selector_type: "item_name", selector_value: "xxxxx" }           // "item_name"      is currently NOT translated
    { selector_type: "actor_has_edge", selector_value: "BRSW.xxxxx" } // "actor_has_edge" is translated
    group: "BRSW.xxxxx"
*/

export const POWER_MODIFIERS_NOVICE = [
  // ADDITIONALRECIPIENTS
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
            selector_type: "item_name", selector_value: "Burrow",
          },
          {
            selector_type: "item_name", selector_value: "Relief",
          },
          {
            selector_type: "item_name", selector_value: "Protection",
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
            selector_type: "item_name", selector_value: "Burrow",
          },
          {
            selector_type: "item_name", selector_value: "Relief",
          },
          {
            selector_type: "item_name", selector_value: "Protection",
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
            selector_type: "item_name", selector_value: "Burrow",
          },
          {
            selector_type: "item_name", selector_value: "Relief",
          },
          {
            selector_type: "item_name", selector_value: "Protection",
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
            selector_type: "item_name", selector_value: "Burrow",
          },
          {
            selector_type: "item_name", selector_value: "Relief",
          },
          {
            selector_type: "item_name", selector_value: "Protection",
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
            selector_type: "item_name", selector_value: "Burrow",
          },
          {
            selector_type: "item_name", selector_value: "Relief",
          },
          {
            selector_type: "item_name", selector_value: "Protection",
          }
        ],
      }
    ],
    group: "BRSW.PowerModifiersGenericAdditionalRecipients"
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
  // BURROW
  {
    id: "POWERBURROWMODPOWER",
    name: "Power",
    button_name: "BRSW.PowerModifiersBurrowPower",
    shotsUsed: "+5",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Burrow" }
    ],
    group: "BRSW.PowerModifiersBurrow"
  },
  // plus Additional Recipients, which is handled by the generic clause above
  // BURST
  {
    id: "POWERBURSTMODDAMAGE",
    name: "Damage (+5d6)",
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
    shotsUsed: "+5",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Burst" }
    ],
    group: "BRSW.PowerModifiersBurst"
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
    name: "Area Effect (+5)",
    button_name: "BRSW.PowerModifiersHavocAreaEffect",
    shotsUsed: "+5",
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
    shotsUsed: "+50",
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
    id: "POWERHEALINGMODCRIPPLINGINJURIES",
    name: "Crippling Injuries",
    button_name: "BRSW.PowerModifiersHealingCripplingInjuries",
    shotsUsed: "+55",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Healing" }
    ],
    group: "BRSW.PowerModifiersHealing"
  },
  {
    id: "POWERHEALINGMODNEUTRALIZEPOISON",
    name: "Neutralize Poison or Disease",
    button_name: "BRSW.PowerModifiersHealingNeutralisePoisonOrDisease",
    shotsUsed: "+5",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Healing" }
    ],
    group: "BRSW.PowerModifiersHealing"
  },
  // PROTECTION
  // ... is just Additional Recipients, which is handled by the generic clause above
  // RELIEF
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
    name: "Stunned (+1)",
    button_name: "BRSW.PowerModifiersReliefStunned",
    shotsUsed: "+1",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Relief" }
    ],
    group: "BRSW.PowerModifiersRelief"
  },
  // plus Additional Recipients, which is handled by the generic clause above
];
