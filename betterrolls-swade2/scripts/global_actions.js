import {get_item_skill} from "./item_card.js";

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


/**
 * Returns the global actions avaliable for an item
 * @param {SwadeItem} item
 * @param {SwadeActor} actor
 */
export function get_actions(item, actor) {
    let actions_avaliable = [];
    game.brsw.GLOBAL_ACTIONS.forEach(action => {
        let selected = false;
        if (action.selector_type === 'skill') {
           const skill = get_item_skill(item, actor);
           selected = skill.name.toLowerCase().includes(action.selector_value);
            // TODO: Use translations for skills.
            // TODO: Use translations for button names.
       }
        if (selected) {
            actions_avaliable.push(action);
        }
    });
    return actions_avaliable;
}