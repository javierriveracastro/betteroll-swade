// noinspection JSUnfilteredForInLoop

import {get_item_trait} from "./item_card.js";

// DMG override is still not implemented.
const SYSTEM_GLOBAL_ACTION = [
    {id: "WTK", name: "Wild Attack", button_name: "BRSW.WildAttack",
        skillMod: 2, dmgMod: 2, dmgOverride: "",
        selector_type: "skill", selector_value: "fighting",
        self_add_status: "Vulnerable", group: "BRSW.AttackOption"},
    {id: "DROP", name:"The Drop", button_name: "BRSW.TheDrop", skillMod: 4,
        dmgMod: 4, dmgOverride: "", selector_type: "item_type",
        selector_value: "weapon", group: "BRSW.SituationalModifiers"},
    {id: "HEAD", name:"Called Shot: Head", button_name: "BRSW.CalledHead", skillMod: -4,
        dmgMod: +4, dmgOverride: "", selector_type: "item_type",
        selector_value: "weapon", group: "BRSW.AttackOption"},
    {id:"ELAN", name:"Elan Edge", button_name:"BRSW.EdgeName-Elan", rerollSkillMod:"+2",
        selector_type:"actor_has_edge", selector_value: "BRSW.EdgeName-Elan",
        defaultChecked:"on", group: "BRSW.Edges"},
    {id:"NO_MERCY", name:"No Mercy Edge", button_name:"BRSW.EdgeName-NoMercy",
        rerollDamageMod:"+2", selector_type:"actor_has_edge",
        selector_value: "BRSW.EdgeName-NoMercy", defaultChecked:"on", group: "BRSW.Edges"},
    {id: "LightCover", name: "Light Cover", button_name: "BRSW.LightCover", skillMod: "-2",
        selector_type: "item_type", selector_value: "weapon", group: "BRSW.Cover"},
    {id: "MediumCover", name: "Medium Cover", button_name: "BRSW.MediumCover",
        skillMod: "-4", selector_type: "item_type", selector_value: "weapon", group: "BRSW.Cover"},
    {id: "HeavyCover", name: "Heavy Cover", button_name: "BRSW.HeavyCover", skillMod: "-6",
        selector_type: "item_type", selector_value: "weapon", group: "BRSW.Cover"},
    {id: "NearTotalCover", name: "Near Total Cover", button_name: "BRSW.NearTotalCover",
        skillMod: "-8", selector_type: "item_type", selector_value: "weapon", group: "BRSW.Cover"}]

/**
 * Registers all the avaliable global actions
 */
export function register_actions() {
    let world_actions = game.settings.get('betterrolls-swade2', 'world_global_actions');
    if (world_actions && world_actions[0] instanceof Array) {
            world_actions = world_actions[0]
    }
    game.brsw.GLOBAL_ACTIONS = SYSTEM_GLOBAL_ACTION.concat(world_actions);
}


/**
 * Returns the global actions avaliable for an item
 * @param {SwadeItem} item
 * @param {SwadeActor} actor
 */
export function get_actions(item, actor) {
    let actions_avaliable = [];
    let disabled_actions = game.settings.get('betterrolls-swade2', 'system_action_disabled');
    if (disabled_actions && disabled_actions[0] instanceof Array) {
        disabled_actions = disabled_actions[0]
    }
    game.brsw.GLOBAL_ACTIONS.forEach(action => {
        if (!disabled_actions.includes(action.id)) {
            let selected = false;
            if (action.hasOwnProperty('selector_type')) {
                selected = check_selector(action.selector_type, action.selector_value, item, actor);
            } else if (action.hasOwnProperty('and_selector')) {
                selected = true;
                for (let selection_option of action.and_selector) {
                    selected &= check_selector(
                        selection_option.selector_type,
                        selection_option.selector_value, item, actor);
                }
            }
            if (selected) {
                actions_avaliable.push(action);
            }
        }
    });
    return actions_avaliable;
}

/**
 * Check if a selector matches
 * @param type: Type of the selector
 * @param value: Value of the selector
 * @param item: item been checked
 * @param actor: actor been checked
 */
function check_selector(type, value, item, actor){
    let selected = false;
    if (type === 'skill') {
       const skill = get_item_trait(item, actor);
       if (skill) {
           selected = skill.name.toLowerCase().includes(value.toLowerCase()) ||
                skill.name.toLowerCase().includes(
                    game.i18n.localize("BRSW.SkillName-" + value));
       }
    } else if (type === 'item_type') {
        selected = item.type === value;
    } else if (type === 'actor_name') {
        selected = actor.name.toLowerCase().includes(value.toLowerCase());
    } else if (type === 'item_name') {
        selected = item.name.toLowerCase().includes(value.toLowerCase());
    } else if (type === 'actor_has_effect') {
        const effect = actor.effects.find(
            effect => effect.data.label.toLowerCase().includes(value.toLowerCase()));
        selected = effect ? ! effect.data.disabled : false;
    } else if (type === 'actor_has_edge') {
        const edge_name = value.includes("BRSW.EdgeName-") ? game.i18n.localize(value) : value;
        const edge = actor.items.find(item => {
            return item.data.type === 'edge' && item.data.name.toLowerCase().includes(
                edge_name.toLowerCase());
        });
        selected = !!edge;
    }
    return selected;
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
        let groups = {}
        let disable_actions = game.settings.get('betterrolls-swade2', 'system_action_disabled');
        if (disable_actions && disable_actions[0] instanceof Array) {
            disable_actions = disable_actions[0]
        }
        for (let action of SYSTEM_GLOBAL_ACTION) {
            if (! groups.hasOwnProperty(action.group)) {
                groups[action.group] = {name: action.group, actions: []};
            }
            groups[action.group].actions.push(
                {id: action.id, name: game.i18n.localize(action.button_name),
                    enabled: !disable_actions.includes(action.id)});
        }
        // noinspection JSValidateTypes
        return {groups: groups};
    }

    activateListeners(html) {
        html.find(".brsw-section-title").click((ev) => {
            const checks = $(ev.currentTarget).parents('table').find('input[type=checkbox]')
            if (checks.length) {
                const new_status = ! $(checks[0]).prop('checked')
                checks.prop('checked', new_status)
            }
        })
        return super.activateListeners(html);
    }

    async _updateObject(_, formData) {
        let disabled_actions = [];
        for (let id in formData) {
            if (!formData[id]) {
                disabled_actions.push(id);
            }
        }
        await game.settings.set('betterrolls-swade2', 'system_action_disabled', disabled_actions);
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
        let actions = game.settings.get('betterrolls-swade2',
            'world_global_actions');
        if (actions && actions[0] instanceof Array) {
            actions = actions[0]
        }
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
        // Activate json check on old actions
        $('.brsw-action-json').on('blur', this.check_json)
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
            // Need to have an id, name
            for (let requisite of ['id', 'name']) {
                if (!action.hasOwnProperty(requisite)) {
                    error = game.i18n.localize("BRSW.MissingJSON") + requisite;
                }
            }
        }
        if (!error) {
            // Check that the keys are supported
            const SUPPORTED_KEYS = ['id', 'name', 'button_name', 'skillMod', 'dmgMod',
                'dmgOverride', 'defaultChecked', 'runSkillMacro', 'runDamageMacro',
                'raiseDamageFormula', 'wildDieFormula', 'rerollSkillMod', 'rerollDamageMod',
                'selector_type', 'selector_value', 'and_selector', 'group', 'shotsUsed']
            for (let key in action) {
                if (SUPPORTED_KEYS.indexOf(key) < 0) {
                    error = game.i18n.localize("BRSW.UnknownActionKey") + key
                }
            }
        }
        const action_title = $(text_area.parentElement).find('h3');
        if (error) {
            // Inputs without name are not passed to updateObject
            console.log(action_title)
            action_title[0].innerHTML = error;
            text_area.removeAttribute('name')
        } else {
            action_title[0].innerHTML = action.name;
            text_area.name = action.name;
        }
    }
}
