// Functions for cards representing attributes

import {BRSW_CONST, get_action_from_click, get_actor_from_message,
    get_roll_options, detect_fumble, spend_bennie, get_actor_from_ids,
    trait_to_string, create_common_card, BRWSRoll, roll_trait} from "./cards_common.js";
import {create_result_card, show_fumble_card} from './result_card.js'

/**
* Creates a chat card for an attribute
*
* @param {Token, SwadeActor} origin  The actor or token owning the attribute
* @param {string} name The name of the attribute like 'vigor'
* @return A promise for the ChatMessage object
*/
async function create_attribute_card(origin, name){
    let actor = origin.hasOwnProperty('actor')?origin.actor:origin;
    let notes = name + " " + trait_to_string(
        actor.data.data.attributes[name.toLowerCase()]);
    let footer = [];
    for (let attribute in actor.data.data.attributes) {
        if (actor.data.data.attributes.hasOwnProperty(attribute)) {
            footer.push(`${attribute} ${trait_to_string(
                actor.data.data.attributes[attribute])}`)
        }
    }
    let trait_roll = new BRWSRoll();
    let message = await create_common_card(origin,
        {header: {type: 'Attribute', title: name, notes: notes},
            footer: footer, trait_roll: trait_roll}, CONST.CHAT_MESSAGE_TYPES.IC,
        "modules/betterrolls-swade2/templates/attribute_card.html")
    await message.setFlag('betterrolls-swade2', 'attribute_id', name);
    // We always set the actor (as a fallback, and the token if possible)
    await message.setFlag('betterrolls-swade2', 'card_type',
        BRSW_CONST.TYPE_ATTRIBUTE_CARD)
    return message
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
    return create_attribute_card(actor, name);
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
    if (action === 'system') return;
    ev.stopImmediatePropagation();
    ev.preventDefault();
    ev.stopPropagation();
    // The attribute id placement is sheet dependent.
    const attribute_id = ev.currentTarget.parentElement.parentElement.dataset.attribute ||
        ev.currentTarget.parentElement.dataset.attribute
    // Show card
    const message = await create_attribute_card(target, attribute_id);
    if (action.includes('trait')) {
        await roll_attribute(message, '', false, {})
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
    const attribute_labels = html.find('.attribute-label a, button.attribute-label');
    attribute_labels.bindFirst('click', async ev => {
        await attribute_click_listener(ev, target);
    });
    attribute_labels.attr('draggable', 'true');
    attribute_labels.on('dragstart',async ev => {
        const macro_data = {name: "Attribute roll", type: "script", scope: "global"}
        const token_id = app.token ? app.token.id : '';
        const actor_id = app.object ? app.object.id : '';
        const attribute_name = ev.currentTarget.parentElement.parentElement.dataset.attribute ||
            ev.currentTarget.parentElement.dataset.attribute
        macro_data.command = `game.brsw.create_attribute_card_from_id('${token_id}', '${actor_id}', '${attribute_name}')`;
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
    html.find('#roll-button').click(async _ =>{
        await roll_attribute(message, html, false, {});
    })
}


/**
 * Roll an attribute showing the roll card and the result card when enables
 *
 * @param {ChatMessage} message
 * @param {string} html Current HTML code of the message
 * @param {boolean} expend_bennie, True if we want to spend a bennie
 * @param {object} default_options: Options to use when there is no html
 */
export async function roll_attribute(message, html,
                                     expend_bennie, default_options){
    await roll_trait(message)
    // If character is a token get true actor
    // noinspection JSUnresolvedVariable
    let actor = get_actor_from_message(message);
    if (expend_bennie) spend_bennie(actor);
    const attribute_id = message.getFlag('betterrolls-swade2', 'attribute_id');
    let options = get_roll_options(html, default_options);
    let total_modifiers = 0;
    options.suppressChat = true;
    options.rof = 1;
    let roll_mods = actor._buildTraitRollModifiers(
        actor.data.data.attributes[attribute_id], options);
    let roll = actor.rollAttribute(attribute_id, options);
    // Customize flavour text
    let flavour =
        `${game.i18n.localize(CONFIG.SWADE.attributes[attribute_id].long)} ${game.i18n.localize('SWADE.AttributeTest')}<br>`;
    roll_mods.forEach(mod => {
        const positive = parseInt(mod.value) > 0?'brsw-positive':'';
        flavour += `<span class="brsw-modifier ${positive}">${mod.label}:&nbsp${mod.value} </span>`;
        total_modifiers = total_modifiers + parseInt(mod.value);
    })
    // If actor is a wild card customize Wild dice color.
    if (actor.isWildcard && game.dice3d) {
        roll.dice[roll.dice.length - 1].options.colorset = game.settings.get(
            'betterrolls-swade2', 'wildDieTheme');
    }
    // Show roll card
    await roll.toMessage({speaker: ChatMessage.getSpeaker({ actor: actor }),
        flavor: flavour});
    // Detect fumbles and show result card
    let is_fumble = await detect_fumble(roll)
    if (is_fumble) {
        await show_fumble_card(actor);
    } else {
        // noinspection JSCheckFunctionSignatures
        await create_result_card(actor, roll.results, total_modifiers,
            message.id, options);
    }
}
