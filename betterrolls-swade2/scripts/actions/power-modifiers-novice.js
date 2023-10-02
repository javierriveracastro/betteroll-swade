/// power modifiers for novice powers ...


/*
  format of power modifier elements ...
    name: "xxxxx", // text for line in damage roll details, currently NOT translated
    button_name: "BRSW.xxxxx", // button text in modal dialog, is translated
    { selector_type: "item_name", selector_value: "xxxxx" }  // currently NOT translated
    group: "BRSW.xxxxx"
*/

export const POWER_MODIFIERS_NOVICE = [
  // BOLT
  {
    id: "POWERBOLTMODDAMAGE",
    name: "Damage (+1d6)", // text for line in damage roll details, currently NOT translated
    button_name: "BRSW.PowerModifiersBoltDamage", // button text in modal dialog, is translated
    shotsUsed: "+2",
    dmgMod: "+d6x",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Bolt" }  // currently NOT translated
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
  // BURST
  {
    id: "POWERBURSTMODDAMAGE",
    name: "Damage (+1d6)",
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
    name: "Area Effect (+1)",
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
    shotsUsed: "+15",
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
    shotsUsed: "+1",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Healing" }
    ],
    group: "BRSW.PowerModifiersHealing"
  },
  // PROTECTION
  {
    id: "POWERPROTECTIONMODADDITIONALRECIPIENTS1",
    name: "Additional Recipients +1",
    button_name: "BRSW.PowerModifiersProtectionAddRecipients1",
    shotsUsed: "+1",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Protection" }
    ],
    group: "BRSW.PowerModifiersProtection"
  },
  {
    id: "POWERPROTECTIONMODADDITIONALRECIPIENTS2",
    name: "Additional Recipients +2",
    button_name: "BRSW.PowerModifiersProtectionAddRecipients2",
    shotsUsed: "+2",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Protection" }
    ],
    group: "BRSW.PowerModifiersProtection"
  },
  {
    id: "POWERPROTECTIONMODADDITIONALRECIPIENTS3",
    name: "Additional Recipients +3",
    button_name: "BRSW.PowerModifiersProtectionAddRecipients3",
    shotsUsed: "+3",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Protection" }
    ],
    group: "BRSW.PowerModifiersProtection"
  },
  {
    id: "POWERPROTECTIONMODADDITIONALRECIPIENTS4",
    name: "Additional Recipients +4",
    button_name: "BRSW.PowerModifiersProtectionAddRecipients4",
    shotsUsed: "+4",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Protection" }
    ],
    group: "BRSW.PowerModifiersProtection"
  },
  {
    id: "POWERPROTECTIONMODADDITIONALRECIPIENTS5",
    name: "Additional Recipients +5",
    button_name: "BRSW.PowerModifiersProtectionAddRecipients5",
    shotsUsed: "+5",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Protection" }
    ],
    group: "BRSW.PowerModifiersProtection"
  },

];
