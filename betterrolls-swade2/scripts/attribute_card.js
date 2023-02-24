// Functions for cards representing attributes
/* global TokenDocument, Token, game, CONST */

import {
    BRSW_CONST, get_action_from_click, get_actor_from_message,
    spend_bennie, get_actor_from_ids, trait_to_string, create_common_card,
    BRWSRoll, roll_trait, process_common_actions
} from "./cards_common.js";
import {get_global_action_from_name} from "./global_actions.js";
import { run_macros } from "./item_card.js";
import {get_enabled_gm_actions} from "./gm_modifiers.js";

/**
/ Translation map for attributes
*/

export const ATTRIBUTES_TRANSLATION_KEYS = {'agility': 'SWADE.AttrAgi',
    'smarts': 'SWADE.AttrSma', 'spirit': 'SWADE.AttrSpr',
    'strength': 'SWADE.AttrStr', 'vigor': 'SWADE.AttrVig'}

/**
* Creates a chat card for an attribute
*
* @param {Token, SwadeActor} origin  The actor or token owning the attribute
* @param {string} name The name of the attribute like 'vigor'
* @param {boolean} collapse_actions
* @return A promise for the ChatMessage object
*/
async function create_attribute_card(origin, name, collapse_actions){
    let actor;
    if (origin instanceof TokenDocument || origin instanceof Token) {
        actor = origin.actor;
    } else {
        actor = origin;
    }
    collapse_actions = collapse_actions ||
        game.settings.get('betterrolls-swade2', 'collapse-modifiers')
    const translated_name = game.i18n.localize(ATTRIBUTES_TRANSLATION_KEYS[name]);
    let title = translated_name + " " + trait_to_string(
        actor.system.attributes[name.toLowerCase()]);
    let footer = [];
    for (let attribute in actor.system.attributes) {
        if (actor.system.attributes.hasOwnProperty(attribute)) {
            footer.push(`${attribute} ${trait_to_string(
                actor.system.attributes[attribute])}`)
        }
    }
    let trait_roll = new BRWSRoll();
    let br_message = await create_common_card(origin,
        {header: {type: game.i18n.localize("BRSW.Attribute"),
                title: title}, footer: footer,
            trait_roll: trait_roll, attribute_name: name,
            actions_collapsed: collapse_actions},
        CONST.CHAT_MESSAGE_TYPES.ROLL,
        "modules/betterrolls-swade2/templates/attribute_card.html")
    // We always set the actor (as a fallback, and the token if possible)
    br_message.attribute_name = name;
    br_message.type = BRSW_CONST.TYPE_ATTRIBUTE_CARD
    await br_message.render()
    await br_message.save();
    return br_message.message
}


/**
 * Creates an attribute card from a token or actor id
 *
 * @param {string} token_id A token id, if it can be solved it will be used
 *  before actor
 * @param {string} actor_id An actor id, it could be set as fallback or
 *  if you keep token empty as the only way to find the actor
 * @param {string} name: Name of the attribute to roll, like 'vigor'
 * @return {Promise} a promise fot the ChatMessage object
 */
function create_attribute_card_from_id(token_id, actor_id, name){
    const actor = get_actor_from_ids(token_id, actor_id);
    return create_attribute_card(actor, name,
        game.settings.get('betterrolls-swade2', 'collapse-modifiers'));
}


/**
 * Hooks the public functions to a global object
 */
export function attribute_card_hooks() {
    game.brsw.create_atribute_card = create_attribute_card;
    game.brsw.create_attribute_card_from_id = create_attribute_card_from_id;
    game.brsw.roll_attribute = roll_attribute;
}


/**
 * Creates a card after an event.
 * @param ev: javascript click event
 * @param {SwadeActor, Token} target: token or actor from the char sheet
 */
async function attribute_click_listener(ev, target) {
    const action = get_action_from_click(ev);
    if (action === 'system') {return;}
    ev.stopImmediatePropagation();
    ev.preventDefault();
    ev.stopPropagation();
    // The attribute id placement is sheet dependent.
    const attribute_id = ev.currentTarget.dataset.attribute
    // Show card
    const message = await create_attribute_card(target, attribute_id, action.includes('trait'));
    if (action.includes('trait')) {
        await roll_attribute(message, $(message.content), false)
    }
}

/**
 * Activates the listeners in the character sheet for attribute cards
 * @param app: Sheet app
 * @param html: Html code
 */
export function activate_attribute_listeners(app, html) {
    let target = app.token?app.token:app.object;
    // We need a closure to hold data
    const attribute_labels = html.find('.attribute-value');
    attribute_labels.bindFirst('click', async ev => {
        await attribute_click_listener(ev, target);
    });
    attribute_labels.attr('draggable', 'true');
    attribute_labels.on('dragstart',async ev => {
        const token_id = app.token ? app.token.id : '';
        const actor_id = app.object ? app.object.id : '';
        const attribute_name = ev.currentTarget.parentElement.parentElement.dataset.attribute ||
            ev.currentTarget.parentElement.dataset.attribute
        let macro_data = {name: attribute_name, type: "script", scope: "global"}
        const bt = "`"
        macro_data.command = `/*######### USAGE #########

When you click this macro or drag it on to a target, the card displayed and rolls made will be determined by whether you are holding down Ctrl, Alt, Shift, or none. Configured in Better Rolls 2 Module Settings.

#########################*/
        
if (event) {
    // If macro can detect the event (click or drag) that triggered it, get which modifier keys are held down during click or drag and apply roll behavior configured in module settings.
    let macro_behavior;
    if (event.ctrlKey === true) {
        macro_behavior = game.settings.get('betterrolls-swade2', 'ctrl_click');
    } else if (event.altKey === true) {
        macro_behavior = game.settings.get('betterrolls-swade2', 'alt_click');
    } else if (event.shiftKey === true) {
        macro_behavior = game.settings.get('betterrolls-swade2', 'shift_click');
    } else {
        macro_behavior = game.settings.get('betterrolls-swade2', 'click');
    }
    if (macro_behavior === 'trait' || macro_behavior === 'trait_damage') {
        // Display Better Rolls 2 card and roll trait
        game.brsw.create_attribute_card_from_id('${token_id}', '${actor_id}', ${bt}${attribute_name}${bt}).then(
            message => {
                game.brsw.roll_attribute(message, "");
            }
        );
    } else if (macro_behavior === 'system') {
        // Display default system card
        let actor = game.actors.get('${actor_id}');
        actor.rollAttribute(${bt}${attribute_name}${bt});
    } else {
        // Display Better Rolls 2 card
        game.brsw.create_attribute_card_from_id('${token_id}', '${actor_id}', ${bt}${attribute_name}${bt});
    }
} else {
    // Event not found, Display Better Rolls 2 card
    game.brsw.create_attribute_card_from_id('${token_id}', '${actor_id}', ${bt}${attribute_name}${bt});
}`;
        ev.originalEvent.dataTransfer.setData(
            'text/plain', JSON.stringify({type:'Macro', data: macro_data}));
    });
}


/**
 * Activate the listeners of the attribute card
 * @param message: Message date
 * @param html: Html produced
 */
export function activate_attribute_card_listeners(message, html) {
    html.find('.brsw-roll-button').click(async ev =>{
        await roll_attribute(message, html, ev.currentTarget.classList.contains(
            'roll-bennie-button'));
    })
}


/**
 * Roll an attribute showing the roll card and the result card when enables
 *
 * @param {ChatMessage} message
 * @param {string} html Current HTML code of the message
 * @param {boolean} expend_bennie, True if we want to spend a bennie
 */
export async function roll_attribute(message, html,
                                     expend_bennie){
    let actor = get_actor_from_message(message);
    const render_data = message.getFlag('betterrolls-swade2', 'render_data')
    const attribute_id = render_data.attribute_name;
    let extra_data = {}
    let pinned_actions = [];
    let macros = [];
    if (html) {
        html.find('.brsw-action.brws-selected').each((_, element) => {
            // noinspection JSUnresolvedVariable
            let action;
            action = get_global_action_from_name(element.dataset.action_id);
            process_common_actions(action, extra_data, macros, actor);
            if (element.classList.contains("brws-permanent-selected")) {
                pinned_actions.push(action.name);
            }
        });
    }
    for (let action of get_enabled_gm_actions()) {
        process_common_actions(action, extra_data, macros, actor)
    }
    for (let group in render_data.action_groups) {
        for (let action of render_data.action_groups[group].actions) {
            // Global and local actions are different
            action.selected = pinned_actions.includes(action.code) ||
                pinned_actions.includes(action.name)
        }
    }
    if (expend_bennie) {await spend_bennie(actor);}
    await roll_trait(message, actor.system.attributes[attribute_id], game.i18n.localize(
        "BRSW.AbilityDie"), html, extra_data);
    // noinspection ES6MissingAwait
    run_macros(macros, actor, null, message);
}
