//
// target actions, i.e. where the target has some sort of effect, such as Dodge
//

export const TARGET_ACTIONS = [
  {
    id: "TARGET-HAS-DODGE-POWERS",
    name: "BRSW.TargetHasDodgePower",
    button_name: "BRSW.TargetHasDodgePower",
    skillMod: "-2",
    and_selector: [
      {
        selector_type: "target_has_edge",
        selector_value: "BRSW.EdgeName-Dodge",
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
    name: "BRSW.TargetHasDodgeWeapon",
    button_name: "BRSW.TargetHasDodgeWeapon",
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
];
