/// power modifiers for novice powers ...

const groupArcaneProtectionName = "BRSW.PowerModifiersArcaneProtection";
const groupBoltName = "BRSW.PowerModifiersBolt";
const groupProtectionName = "BRSW.PowerModifiersProtection";

export const POWER_MODIFIERS_NOVICE = [
  {
    // BOLT
    id: "POWERBOLTMODDAMAGE",
    name: "Damage (+1d6)", // text for line in damage roll details, currently NOT translated
    button_name: "BRSW.PowerModifiersBoltDamage", // button text in modal dialog, is translated
    shotsUsed: "+2",
    dmgMod: "+d6x",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Bolt" }  // currently NOT translated
    ],
    group: groupBoltName
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
    group: groupBoltName
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
    group: groupBoltName
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
    group: groupBoltName
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
    group: groupProtectionName
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
    group: groupProtectionName
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
    group: groupProtectionName
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
    group: groupProtectionName
  },

];
