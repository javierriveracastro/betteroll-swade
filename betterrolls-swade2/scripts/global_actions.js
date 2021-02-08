const SYSTEM_GLOBAL_ACTION = [
    {name: "Wild Attack", button_name: "Wild Attack", skill_mod: 2, alt_skill: "",
    dmg_mod: 2, dmg_override: "", selector_type: "skill", selector_value: "fighting"},
]

/**
 * Registers all the avaliable global actions
 */
export function register_actions() {
    game.brsw.GLOBAL_ACTIONS = SYSTEM_GLOBAL_ACTION;
}