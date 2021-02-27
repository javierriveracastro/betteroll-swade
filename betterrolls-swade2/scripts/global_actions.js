import {get_item_skill} from "./item_card.js";

// DMG override is still not implemented.
const SYSTEM_GLOBAL_ACTION = [
    {id: "WTK", name: "Wild Attack", button_name: "BRSW.WildAttack",
        skillMod: 2, dmgMod: 2, dmgOverride: "",
        selector_type: "skill", selector_value: "fighting",
        self_add_status: "Vulnerable"},
    {id: "DROP", name:"The Drop", button_name: "BRSW.TheDrop", skillMod: 4,
        dmgMod: 4, dmgOverride: "", selector_type: "item_type",
        selector_value: "weapon"}
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
           if (skill) {
               selected = skill.name.toLowerCase().includes(action.selector_value) ||
                    skill.name.toLowerCase().includes(
                        game.i18n.localize("BRSW.SkillName-" + action.selector_value));
           }
       }
        if (selected) {
            actions_avaliable.push(action);
        }
    });
    return actions_avaliable;
}

/**
 * Returns a global action from a name
 * @param {string} name
 */
export function get_global_action_from_name(name) {
    for (let action of game.brsw.GLOBAL_ACTIONS) {
        if (action.name === name) {
            return action;
        }
    }
}


// noinspection JSPrimitiveTypeWrapperUsage
/**
 * The global action selection window
 */
export class SystemGlobalConfiguration extends FormApplication {
    static get defaultOptions() {
        let options = super.defaultOptions;
        options.id = 'brsw-global-actions';
        options.template = "/modules/betterrolls-swade2/templates/system_globals.html";
        return options;
    }

    getData(_) {
        let actions = [];
        // No idea why the 0...
        let disable_actions = game.settings.get('betterrolls-swade2', 'system_action_disabled')[0];
        for (let action of SYSTEM_GLOBAL_ACTION) {
            actions.push({id: action.id, name: action.name,
                enabled: !disable_actions.includes(action.id)});
        }
        // noinspection JSValidateTypes
        return {actions: actions};
    }

    async _updateObject(_, formData) {
        let disabled_actions = [];
        for (let id in formData) {
            if (!formData[id]) {
                console.log(id)
                disabled_actions.push(id);
            }
        }
        game.settings.set('betterrolls-swade2', 'system_action_disabled', disabled_actions);
    }
}