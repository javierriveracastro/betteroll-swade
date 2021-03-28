import {get_item_skill} from "./item_card.js";

// DMG override is still not implemented.
const SYSTEM_GLOBAL_ACTION = [
    {id: "WTK", name: "Wild Attack", button_name: "BRSW.WildAttack",
        skillMod: 2, dmgMod: 2, dmgOverride: "",
        selector_type: "skill", selector_value: "fighting",
        self_add_status: "Vulnerable"},
    {id: "DROP", name:"The Drop", button_name: "BRSW.TheDrop", skillMod: 4,
        dmgMod: 4, dmgOverride: "", selector_type: "item_type",
        selector_value: "weapon"},
    {id: "HEAD", name:"Called Shot: Head", button_name: "BRSW.CalledHead", skillMod: -4,
        dmgMod: +4, dmgOverride: "", selector_type: "item_type",
        selector_value: "weapon"},
]

/**
 * Registers all the avaliable global actions
 */
export function register_actions() {
    game.brsw.GLOBAL_ACTIONS = SYSTEM_GLOBAL_ACTION.concat(
        game.settings.get('betterrolls-swade2', 'world_global_actions'));
}


/**
 * Returns the global actions avaliable for an item
 * @param {SwadeItem} item
 * @param {SwadeActor} actor
 */
export function get_actions(item, actor) {
    let actions_avaliable = [];
    const disabled_actions = game.settings.get('betterrolls-swade2', 'system_action_disabled')[0];
    game.brsw.GLOBAL_ACTIONS.forEach(action => {
        if (!disabled_actions.includes(action.id)) {
            let selected = false;
            if (action.selector_type === 'skill') {
               const skill = get_item_skill(item, actor);
               if (skill) {
                   selected = skill.name.toLowerCase().includes(action.selector_value) ||
                        skill.name.toLowerCase().includes(
                            game.i18n.localize("BRSW.SkillName-" + action.selector_value));
               }
           } else if (action.selector_type === 'item_type') {
                selected = item.type === action.selector_value;
            }
            if (selected) {
                actions_avaliable.push(action);
            }
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
            actions.push({id: action.id, name: game.i18n.localize(action.button_name),
                enabled: !disable_actions.includes(action.id)});
        }
        // noinspection JSValidateTypes
        return {actions: actions};
    }

    async _updateObject(_, formData) {
        let disabled_actions = [];
        for (let id in formData) {
            if (!formData[id]) {
                disabled_actions.push(id);
            }
        }
        game.settings.set('betterrolls-swade2', 'system_action_disabled', disabled_actions);
    }
}


// noinspection JSPrimitiveTypeWrapperUsage
export class WorldGlobalActions extends FormApplication {
    static get defaultOptions() {
        let options = super.defaultOptions;
        options.id = 'brsw-world-actions';
        options.template = '/modules/betterrolls-swade2/templates/world_globals.html';
        options.width = 400;
        options.height = 600;
        return options;
    }

    getData(_) {
        return {};
    }

    async _updateObject(_, formData){

    }

    activateListeners(html) {
        // noinspection JSUnresolvedFunction
        html.find('.brsw-new-action').on('click', ev => {
            ev.preventDefault();
            // noinspection JSUnresolvedFunction
            const action_list = html.find(".brsw-action-list");
            console.log(action_list)
            action_list.prepend("<div class='brsw-edit-action'><h3 class='brsw-action-title'>New</h3><textarea class='brsw-action-json'></textarea></div>");
        });
    }
}

// TODOS:
// When a rule text is modified, check if it is valid (as much as possible).
// Save that entry
// Show all entries in a table
// Add a button to edit an entre
// Add a button to delete an entry
