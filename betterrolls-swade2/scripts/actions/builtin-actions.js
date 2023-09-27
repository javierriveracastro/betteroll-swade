import { COMBAT_OPTIONS } from "./combat_options.js";
import { POWER_POINT_OPTIONS } from "./PowerPoints.js";
import { BACKGROUND_EDGES } from "./background_edges.js";
import { GENERIC_POWER_MODIFIERS } from "./power-generic-modifiers.js";

export const SYSTEM_GLOBAL_ACTION = [
  {
    id: "NO_MERCY",
    name: "No Mercy Edge",
    button_name: "BRSW.EdgeName-NoMercy",
    rerollDamageMod: "+2",
    selector_type: "actor_has_edge",
    selector_value: "BRSW.EdgeName-NoMercy",
    defaultChecked: "on",
    group: "BRSW.Edges",
  },
  {
    id: "FRENZY",
    name: "Frenzy",
    button_name: "BRSW.EdgeName-Frenzy",
    and_selector: [
      { selector_type: "skill", selector_value: "fighting" },
      {
        selector_type: "actor_has_edge",
        selector_value: "BRSW.EdgeName-Frenzy",
      },
      { selector_type: "item_type", selector_value: "weapon" },
      {
        not_selector: [
          {
            selector_type: "actor_has_edge",
            selector_value: "BRSW.EdgeName-ImprovedFrenzy",
          },
        ],
      },
    ],
    defaultChecked: "on",
    group: "BRSW.Edges",
    rof: "2",
  },
  {
    id: "IMPROVED FRENZY",
    name: "Improved Frenzy",
    button_name: "BRSW.EdgeName-ImprovedFrenzy",
    and_selector: [
      { selector_type: "skill", selector_value: "fighting" },
      {
        selector_type: "actor_has_edge",
        selector_value: "BRSW.EdgeName-ImprovedFrenzy",
      },
      { selector_type: "item_type", selector_value: "weapon" },
    ],
    defaultChecked: "on",
    group: "BRSW.Edges",
    rof: "3",
  },
  {
    id: "MARKSMAN",
    name: "Marksman",
    button_name: "BRSW.EdgeName-Marksman",
    skillMod: "+1",
    and_selector: [
      {
        selector_type: "actor_has_edge",
        selector_value: "BRSW.EdgeName-Marksman",
      },
      { selector_type: "skill", selector_value: "BRSW.Shooting" },
    ],
    group: "BRSW.Edges",
  },
  {
    id: "MRFIXIT",
    name: "Mr Fix It",
    button_name: "BRSW.EdgeName-MrFixIt",
    skillMod: "+2",
    and_selector: [
      {
        selector_type: "actor_has_edge",
        selector_value: "BRSW.EdgeName-MrFixIt",
      },
      { selector_type: "skill", selector_value: "Repair" },
    ],
    defaultChecked: "on",
    group: "BRSW.Edges",
  },
  {
    id: "UNARMEDDEFENDER",
    name: "Unarmed Defender",
    button_name: "BRSW.UnarmedDefender",
    skillMod: "+2",
    selector_type: "skill",
    selector_value: "fighting",
    group: "BRSW.SituationalModifiers",
  },
  {
    id: "RANSTEADY",
    name: "Ran-Steady",
    button_name: "BRSW.RanSteady",
    skillMod: "-1",
    and_selector: [
      {
        selector_type: "actor_has_edge",
        selector_value: "BRSW.EdgeName-Steady-Hands",
      },
      { selector_type: "all" },
    ],
    group: "BRSW.Multi-action",
  },
  {
    id: "ALLTHUMBS",
    name: "All Thumbs",
    button_name: "BRSW.EdgeName-All-Thumbs",
    skillMod: "-2",
    selector_type: "actor_has_hindrance",
    selector_value: "BRSW.EdgeName-All-Thumbs",
    group: "BRSW.Hindrances",
  },
  {
    id: "BLIND",
    name: "Blind",
    button_name: "BRSW.EdgeName-Blind",
    skillMod: "-6",
    selector_type: "actor_has_hindrance",
    selector_value: "BRSW.EdgeName-Blind",
    defaultChecked: "on",
    group: "BRSW.Hindrances",
  },
  {
    id: "CANTSWIN",
    name: "Can't Swim",
    button_name: "BRSW.EdgeName-Cant-Swim",
    skillMod: "-2",
    and_selector: [
      { selector_type: "actor_has_hindrance", selector_value: "Can't Swim" },
      { selector_type: "skill", selector_value: "Athletics" },
    ],
    group: "BRSW.Hindrances",
  },
  {
    id: "Clueless",
    name: "Clueless",
    button_name: "BRSW.EdgeName-Clueless",
    skillMod: "-1",
    and_selector: [
      {
        selector_type: "actor_has_hindrance",
        selector_value: "BRSW.EdgeName-Clueless",
      },
      {
        or_selector: [
          {
            selector_type: "skill",
            selector_value: "BRSW.SkillName-CommonKnowledge",
          },
          { selector_type: "skill", selector_value: "BRSW.SkillName-Notice" },
        ],
      },
    ],
    defaultChecked: "on",
    group: "BRSW.Hindrances",
  },
  {
    id: "Clumsy",
    name: "Clumsy",
    button_name: "BRSW.EdgeName-Clumsy",
    skillMod: "-2",
    and_selector: [
      {
        selector_type: "actor_has_hindrance",
        selector_value: "BRSW.EdgeName-Clumsy",
      },
      {
        or_selector: [
          {
            selector_type: "skill",
            selector_value: "BRSW.SkillName-Athletics",
          },
          { selector_type: "skill", selector_value: "BRSW.SkillName-Stealth" },
        ],
      },
    ],
    defaultChecked: "on",
    group: "BRSW.Hindrances",
  },
  {
    id: "Hard of Hearing",
    name: "Hard of Hearing",
    button_name: "BRSW.EdgeName-HardOfHearing",
    skillMod: "-4",
    and_selector: [
      {
        selector_type: "actor_has_hindrance",
        selector_value: "BRSW.EdgeName-HardOfHearing",
      },
      { selector_type: "skill", selector_value: "BRSW.SkillName-Notice" },
    ],
    group: "BRSW.Hindrances",
  },
  {
    id: "Mean",
    name: "Mean",
    button_name: "BRSW.EdgeName-Mean",
    skillMod: "-1",
    and_selector: [
      {
        selector_type: "actor_has_hindrance",
        selector_value: "BRSW.EdgeName-Mean",
      },
      { selector_type: "skill", selector_value: "BRSW.SkillName-Persuasion" },
    ],
    defaultChecked: "on",
    group: "BRSW.Hindrances",
  },
  {
    id: "Mild Mannered",
    name: "Mild Mannered",
    button_name: "BRSW.EdgeName-MildMannered",
    skillMod: "-2",
    and_selector: [
      {
        selector_type: "actor_has_hindrance",
        selector_value: "BRSW.EdgeName-MildMannered",
      },
      { selector_type: "skill", selector_value: "BRSW.SkillName-Intimidation" },
    ],
    defaultChecked: "on",
    group: "BRSW.Hindrances",
  },
  {
    id: "Outsider",
    name: "Outsider",
    button_name: "BRSW.EdgeName-Outsider",
    skillMod: "-2",
    and_selector: [
      {
        selector_type: "actor_has_hindrance",
        selector_value: "BRSW.EdgeName-Outsider",
      },
      { selector_type: "skill", selector_value: "BRSW.SkillName-Persuasion" },
      {
        not_selector: [
          { selector_type: "actor_has_hindrance", selector_value: "Outsider+" },
        ],
      },
    ],
    defaultChecked: "on",
    group: "BRSW.Hindrances",
  },
  {
    id: "Tongue Tied",
    name: "Tongue Tied",
    button_name: "BRSW.EdgeName-TongueTied",
    skillMod: "-1",
    and_selector: [
      {
        selector_type: "actor_has_hindrance",
        selector_value: "BRSW.EdgeName-TongueTied",
      },
      {
        or_selector: [
          {
            selector_type: "skill",
            selector_value: "BRSW.SkillName-Performance",
          },
          {
            selector_type: "skill",
            selector_value: "BRSW.SkillName-Persuasion",
          },
          { selector_type: "skill", selector_value: "BRSW.SkillName-Taunt" },
          {
            selector_type: "skill",
            selector_value: "BRSW.SkillName-Intimidation",
          },
        ],
      },
    ],
    defaultChecked: "on",
    group: "BRSW.Hindrances",
  },
  {
    id: "Free runner",
    name: "Free runner",
    button_name: "BRSW.ApplyFreeRunner",
    skillMod: "+2",
    and_selector: [
      {
        selector_type: "actor_has_edge",
        selector_value: "BRSW.EdgeName-FreeRunner",
      },
      { selector_type: "skill", selector_value: "BRSW.SkillName-Athletics" },
    ],
    group: "BRSW.Edges",
  },
  {
    id: "Giant Killer",
    name: "Giant Killer",
    button_name: "BRSW.EdgeName-GiantKiller",
    dmgMod: "+1d6x",
    and_selector: [
      {
        selector_type: "actor_has_edge",
        selector_value: "BRSW.EdgeName-GiantKiller",
      },
      {
        or_selector: [
          { selector_type: "item_type", selector_value: "weapon" },
          { selector_type: "item_type", selector_value: "power" },
        ],
      },
    ],
    group: "BRSW.Edges",
  },
  {
    id: "Martial Artist",
    name: "MartialArtist",
    button_name: "BRSW.EdgeName-MartialArtist",
    skillMod: "+1",
    and_selector: [
      {
        selector_type: "actor_has_edge",
        selector_value: "BRSW.EdgeName-MartialArtist",
      },
      { selector_type: "item_name", selector_value: "unarmed" },
      {
        not_selector: [
          {
            selector_type: "actor_has_edge",
            selector_value: "BRSW.EdgeName-MartialWarrior",
          },
        ],
      },
    ],
    defaultChecked: "on",
    group: "BRSW.Edges",
  },
  {
    id: "Martial Warrior",
    name: "MartialWarrior",
    button_name: "BRSW.EdgeName-MartialWarrior",
    skillMod: "+2",
    and_selector: [
      {
        selector_type: "actor_has_edge",
        selector_value: "BRSW.EdgeName-MartialWarrior",
      },
      { selector_type: "item_name", selector_value: "unarmed" },
    ],
    defaultChecked: "on",
    group: "BRSW.Edges",
  },
  {
    id: "Target has dodge",
    name: "The target has dodge (weapon)",
    button_name: "BRSW.TargetHasDodge",
    skillMod: "-2",
    and_selector: [
      { selector_type: "item_type", selector_value: "weapon" },
      {
        selector_type: "target_has_edge",
        selector_value: "BRSW.EdgeName-Dodge",
      },
      {
        or_selector: [
          { selector_type: "skill", selector_value: "BRSW.Shooting" },
          { selector_type: "skill", selector_value: "Athletics" },
        ],
      },
    ],
    defaultChecked: "on",
    group: "BRSW.Target",
  },
  {
    id: "Assassin",
    name: "Assassin",
    button_name: "BRSW.EdgeName-Assassin",
    dmgMod: "+2",
    and_selector: [
      {
        selector_type: "actor_has_edge",
        selector_value: "BRSW.EdgeName-Assassin",
      },
      {
        or_selector: [
          { selector_type: "item_type", selector_value: "weapon" },
          { selector_type: "item_type", selector_value: "power" },
        ],
      },
    ],
    group: "BRSW.Edges",
  },
  {
    id: "Investigator",
    name: "Investigator",
    button_name: "BRSW.EdgeName-Investigator",
    skillMod: "+2",
    nd_selector: [
      { selector_type: "actor_has_edge", selector_value: "Fame" },
      {
        or_selector: [
          { selector_type: "skill", selector_value: "BRSW.SkillName-Notice" },
          { selector_type: "skill", selector_value: "BRSW.SkillName-Research" },
        ],
      },
    ],
    group: "BRSW.Edges",
  },
  {
    id: "Target has dodge 2",
    name: "The target has dodge (power)",
    button_name: "BRSW.TargetHasDodgePower",
    skillMod: "-2",
    and_selector: [
      {
        selector_type: "target_has_edge",
        selector_value: "BRSW.EdgeName-Dodge",
      },
      { selector_type: "item_type", selector_value: "power" },
    ],
    defaultChecked: "on",
    group: "BRSW.Target",
  },
  {
    id: "SWEEP",
    name: "Sweep",
    button_name: "BRSW.EdgeName-Sweep",
    skillMod: "-2",
    extra_text: "TEMP: Applying -2 penalty for One-Handed Weapon, so add +2 if using Two-Handed Weapon. Target <b>ALL</b> targets within weapon reach",
    and_selector: [
      { selector_type: "skill", selector_value: "fighting" },
      {
        selector_type: "actor_has_edge",
        selector_value: "BRSW.EdgeName-Sweep",
      },
      { selector_type: "item_type", selector_value: "weapon" },
      {
        not_selector: [
          {
            selector_type: "actor_has_edge",
            selector_value: "BRSW.EdgeName-SweepImproved",
          },
        ],
      },
    ],
    group: "BRSW.Edges",
  },
  {
    id: "IMPROVED-SWEEP",
    name: "Improved Sweep",
    button_name: "BRSW.EdgeName-SweepImproved",
    skillMod: "-2",
    extra_text: "TEMP: Applying -2 penalty for One-Handed Weapon, so add +2 if using Two-Handed Weapon. Target all targets within weapon reach, <b>avoiding</b> allies",
    and_selector: [
      { selector_type: "skill", selector_value: "fighting" },
      {
        selector_type: "actor_has_edge",
        selector_value: "BRSW.EdgeName-SweepImproved",
      },
      { selector_type: "item_type", selector_value: "weapon" },
    ],
    group: "BRSW.Edges",
  },
]
  .concat(COMBAT_OPTIONS)
  .concat(POWER_POINT_OPTIONS)
  .concat(BACKGROUND_EDGES)
  .concat(GENERIC_POWER_MODIFIERS);
