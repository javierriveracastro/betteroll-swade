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
        game.settings.get('betterrolls-swade2', 'world_global_actions')[0]);
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
        const actions = game.settings.get('betterrolls-swade2',
            'world_global_actions')[0];
        let formatted_actions = []
        for (let action of actions) {
            formatted_actions.push({name: action.name,
                json: JSON.stringify(action)});
        }
        // noinspection JSValidateTypes
        return {actions: formatted_actions};
    }

    async _updateObject(_, formData){
        let new_world_actions = [];
        for (let action in formData) {
            new_world_actions.push(JSON.parse(formData[action]));
        }
        await game.settings.set('betterrolls-swade2', 'world_global_actions',
            new_world_actions);
        register_actions();
    }

    activateListeners(html) {
        // noinspection JSUnresolvedFunction
        html.find('.brsw-new-action').on('click', ev => {
            ev.preventDefault();
            // noinspection JSUnresolvedFunction
            const action_list = html.find(".brsw-action-list");
            let new_action = $("<div class='brsw-edit-action'><h3 class='brsw-action-title'>New</h3></div>");
            let new_textarea = $("<textarea class='brsw-action-json'></textarea>")
            new_textarea.on('blur', this.check_json);
            action_list.prepend(new_action.append(new_textarea));
        });
        // noinspection JSUnresolvedFunction
        html.find('.fas.fa-trash').on('click', ev => {
            const row = ev.currentTarget.parentElement.parentElement;
            row.remove();
        })
        super.activateListeners(html);
    }
    
    check_json(ev) {
        // Checks the json in a textarea
        const text_area = ev.currentTarget;
        let error = '';
        let action;
        // Json loads.
        try {
            action = JSON.parse(text_area.value);
        } catch (_) {
            error = game.i18n.localize("BRSW.InvalidJSONError");
        }
        if (!error) {
            // Need to have an id, name, selector_type, selector_value
            for (let requisite of ['id', 'name', 'selector_type', 'selector_value']) {
                if (!action.hasOwnProperty(requisite)) {
                    error = game.i18n.localize("BRSW.MissingJSON") + requisite;
                }
            }
        }
        const action_title = text_area.previousSibling;
        if (error) {
            // Inputs without name are not passed to updateObject
            action_title.innerHTML = error;
            text_area.removeAttribute('name')
        } else {
            action_title.innerHTML = action.name;
            text_area.name = action.name;
        }
    }
}
