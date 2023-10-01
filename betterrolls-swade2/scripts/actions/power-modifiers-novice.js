/// power modifiers for novice powers ...

const groupBoltName = "BRSW.PowerModifiersBolt";

export const POWER_MODIFIERS_NOVICE = [
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
    name: starIcon + "Rate of Fire (+2)",
    button_name: starIcon + "Rate of Fire (+2)",
    shotsUsed: "+2",
    rof: "2",
    and_selector: [
      { selector_type: "item_type", selector_value: "power" },
      { selector_type: "item_name", selector_value: "Bolt" },
      { selector_type: "actor_has_edge", selector_value: "BRSW.EdgeName-Epic-Mastery" }
    ],
    group: groupBoltName
  },

];
