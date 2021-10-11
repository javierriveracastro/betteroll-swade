/* globals game, FormApplication, console, Dialog, saveDataToFile, ui, readTextFromFile, renderTemplate */
/* jshint -W089 */

import {get_item_trait} from "./item_card.js";
import {broofa} from "./utils.js";

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
    {id:"FRENZY", name:"Frenzy", button_name:"BRSW.EdgeName-Frenzy",
        and_selector: [{selector_type: "skill", selector_value: "fighting"},
            {selector_type:"actor_has_edge", selector_value: "BRSW.EdgeName-Frenzy"}],
        defaultChecked:"on", group: "BRSW.Edges", rof: "2"},
    {id: "LightCover", name: "Light Cover", button_name: "BRSW.LightCover", skillMod: "-2",
        selector_type: "item_type", selector_value: "weapon", group: "BRSW.Cover"},
    {id: "MediumCover", name: "Medium Cover", button_name: "BRSW.MediumCover",
        skillMod: "-4", selector_type: "item_type", selector_value: "weapon", group: "BRSW.Cover"},
    {id: "HeavyCover", name: "Heavy Cover", button_name: "BRSW.HeavyCover", skillMod: "-6",
        selector_type: "item_type", selector_value: "weapon", group: "BRSW.Cover"},
    {id: "NearTotalCover", name: "Near Total Cover", button_name: "BRSW.NearTotalCover",
        skillMod: "-8", selector_type: "item_type", selector_value: "weapon", group: "BRSW.Cover"},
    {id: "Dim", name: "Dim", button_name: "BRSW.IlluminationDim", skillMod: "-2", selector_type: "all", group: "BRSW.Illumination"},
    {id: "Dark", name: "Dark", button_name: "BRSW.IlluminationDark", skillMod: "-4", selector_type: "all", group: "BRSW.Illumination"},
    {id: "Pitch", name: "Pitch Dark", button_name: "BRSW.IlluminationPitch", skillMod: "-6", selector_type: "all", group: "BRSW.Illumination"},
    {id: "UNSTABLEPLATFORM", name: "Unstable Platform", button_name: "BRSW.UnstablePlatform", "skillMod": "-2", "or_selector":[
        {"selector_type":"skill", "selector_value":"BRSW.Shooting"}, {"selector_type":"skill", "selector_value":"BRSW.ThrowingSkill"}],
        "group": "BRSW.SituationalModifiers"},
    {id:"MARKSMAN", name:"Marksman", button_name: "BRSW.EdgeName-Marksman", "skillMod": "+1", and_selector:[
        {selector_type:"actor_has_edge", selector_value:"BRSW.EdgeName-Marksman"},
        {selector_type:"skill", selector_value:"BRSW.Shooting"}], group: "BRSW.Edges"},
    {id:"ALERTNESS", name:"Alertness", button_name:"BRSW.EdgeName-Alertness", skillMod: "+2", and_selector:[
        {selector_type:"actor_has_edge", selector_value:"BRSW.EdgeName-Alertness"},
        {selector_type:"skill", selector_value:"Notice"}], "defaultChecked":"on", "group": "BRSW.Edges"},
    {id:"MRFIXIT", name:"Mr Fix It", button_name:"BRSW.EdgeName-MrFixIt", skillMod: "+2", and_selector:[
        {selector_type:"actor_has_edge", selector_value: "BRSW.EdgeName-MrFixIt"},
        {selector_type:"skill", selector_value:"Repair"}], defaultChecked:"on", group: "BRSW.Edges"},
    {id: "UNARMEDDEFENDER", name: "Unarmed Defender", button_name: "BRSW.UnarmedDefender", skillMod: "+2",
        selector_type: "skill", selector_value: "Fighting", group: "BRSW.SituationalModifiers"},
    {id: "TOUCHATTACK", name: "Touch Attack", button_name: "BRSW.TouchAttack", skillMod: "+2", dmgOverride: "0", 
        selector_type: "skill", selector_value: "Fighting", group: "BRSW.SituationalModifiers"},
    {id: "NONLETHALDAMAGE", name: "Nonlethal Damage", button_name: "BRSW.NonlethalDamage", skillMod: "-1", 
        selector_type: "skill", selector_value: "Fighting", group: "BRSW.SituationalModifiers"},
]
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
  * Processs and and selector.
  * @param selected
  * @param action
  * @param item
  * @param actor
  * @return {boolean}
  */
 function process_and_selector(selected, action, item, actor) {
     selected = true;
     for (let selection_option of action.and_selector) {
         selected = selected && check_selector(
             selection_option.selector_type,
             selection_option.selector_value, item, actor);
         console.log(selected)
         console.log(selection_option.selector_type, selection_option.selector_value)
         console.log(check_selector(
             selection_option.selector_type,
             selection_option.selector_value, item, actor))
     }
     return selected;
 }

 function process_or_selector(selected, action, item, actor) {
     selected = false;
     for (let selection_option of action.or_selector) {
         if (check_selector(selection_option.selector_type,
             selection_option.selector_value, item, actor)) {
             selected = true;
             break;
         }
     }
     return selected;
 }

 /**
 * Returns the global actions avaliable for an item
 * @param {Item} item
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
                selected = process_and_selector(selected, action, item, actor);
            } else if (action.hasOwnProperty('or_selector')) {
                selected = process_or_selector(selected, action, item, actor);
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
        const skill = item.type === 'skill' ? item : get_item_trait(item, actor);
        if (skill) {
            if (value.slice(0, 4) === "BRSW.") {
                selected = skill.name.toLowerCase().includes(
                    game.i18n.localize(value).toLowerCase())
            } else {
                selected = skill.name.toLowerCase().includes(value.toLowerCase()) ||
                    skill.name.toLowerCase().includes(
                        game.i18n.localize("BRSW.SkillName-" + value));
            }
        }
    } else if (type === "all") {
        selected = true;
    } else if (type === 'item_type') {
        selected = item.type === value;
    } else if (type === 'actor_name') {
        selected = actor.name.toLowerCase().includes(value.toLowerCase());
    } else if (type === 'item_name' && item.type !== 'skill') {
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
    } else if (type === 'actor_has_hindrance') {
        const hindrance_name = value.includes("BRSW.HindranceName-") ?
            game.i18n.localize(value) : value;
        const hindrance = actor.items.find(item => {
            return item.data.type === 'hindrance' && item.data.name.toLowerCase().includes(
                hindrance_name.toLowerCase());
        });
        selected = !!hindrance;
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
        // Export and import
        $('.brsw-export-json').on('click', export_global_actions)
        $('.brsw-import-json').on('click', import_global_actions)
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
                'selector_type', 'selector_value', 'and_selector', 'group', 'shotsUsed',
                'or_selector', 'rof', 'self_add_status']
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

/**
 * Creates the action group array
 * @param action_groups
 * @param item
 * @param actor
 */
export function create_actions_array(action_groups,item, actor) {
    get_actions(item, actor).forEach(global_action => {
        const has_skill_mod = !!global_action.skillMod;
        const has_dmg_mod = !!global_action.dmgMod;
        const button_name = global_action.button_name.slice(0, 5) === "BRSW." ?
            game.i18n.localize(global_action.button_name) : global_action.button_name;
        const pinned = global_action.hasOwnProperty('defaultChecked')
        let group_name = global_action.group ? global_action.group : "BRSW.NoGroup"
        let group_name_id = group_name.split('.').join('')
        if (!action_groups.hasOwnProperty(group_name_id)) {
            const translated_group = group_name.slice(0, 5) === 'BRSW.' ?
                game.i18n.localize(group_name) : group_name
            action_groups[group_name_id] = {
                name: translated_group, actions: [],
                id: broofa()
            }
        }
        action_groups[group_name_id].actions.push(
            {
                code: global_action.name, name: button_name, pinned: pinned,
                damage_icon: has_dmg_mod, skill_icon: has_skill_mod
            });
    });
    return action_groups
}

/**
 * Exports custom global actions to a json file.
 */
function export_global_actions() {
    let actions = game.settings.get('betterrolls-swade2',
            'world_global_actions');
    saveDataToFile(JSON.stringify(actions), 'json', "world_actions.json")
}

/**
 * Import global actions from disk
 * @return {Promise<void>}
 */
async function import_global_actions() {
    new Dialog({
      title: `Import Data: ${this.name}`,
      content: await renderTemplate("templates/apps/import-data.html",
          {
            hint1: 'hint1',
            hint2: 'hint2'}),
      buttons: {
        import: {
          icon: '<i class="fas fa-file-import"></i>',
          label: "Import",
          callback: html => {
            const form = html.find("form")[0];
            if ( !form.data.files.length ) {return ui.notifications.error("You did not upload a data file!");}
            readTextFromFile(form.data.files[0]).then((json) => {
                game.settings.set('betterrolls-swade2', "world_global_actions", JSON.parse(json))
                window.location.reload()
            });
          }
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      default: "import"
    }, {
      width: 400
    }).render(true);
}