// Functions for cards representing attributes

import {create_basic_chat_data, BRSW_CONST, get_action_from_click,
    get_actor_from_message} from "./cards_common.js";

/**
* Creates a card for an attribute
* @param {token, actor} origin  The actor or token owning the attribute
* @param {string} name The name of the attribute
* @return A promise for the ChatMessage object
*/
async function create_attribute_card(origin, name){
    let actor = origin.hasOwnProperty('actor')?origin.actor:origin;
    let chatData = create_basic_chat_data(actor, CONST.CHAT_MESSAGE_TYPES.IC);
    let notes = `${name} d${actor.data.data.attributes[name.toLowerCase()].die.sides}`;
    let modifier = parseInt(
        actor.data.data.attributes[name.toLowerCase()].die.modifier);
    if (modifier) {
        notes = notes + (modifier > 0?"+":"") + modifier;
    }
    chatData.content = await renderTemplate(
        "modules/betterrolls-swade/templates/attribute_card.html",
        {actor: actor, header: {type: 'Attribute', title: name,
            notes: notes}});
    let message = await ChatMessage.create(chatData);
    await message.setFlag('betterrolls-swade', 'card_type',
        BRSW_CONST.TYPE_ATTRIBUTE_CARD)
    await message.setFlag('betterrolls-swade', 'attribute_id', name);
    if (actor === origin) {
        await message.setFlag('betterrolls-swade', 'actor',
            actor.id)
    } else {
        await message.setFlag('betterrolls-swade', 'token',
            origin.id)
    }
    return message
}

/**
 * Hooks the public functions to a global object
 */
export function attribute_card_hooks() {
    game.brsw.create_atribute_card = create_attribute_card;
}


/**
 * Listener for clicks on attributes
 * @param ev: javascript click event
 * @param {actor, token} target: token or actor from the char sheet
 */
async function attribute_click_listener(ev, target) {
    const action = get_action_from_click(ev);
    if (action === 'system') return;
    ev.stopImmediatePropagation();
    ev.preventDefault();
    ev.stopPropagation();
    // Show card
    await create_attribute_card(
      target, ev.currentTarget.parentElement.parentElement.dataset.attribute);
    if (action.includes('trait')) {
        roll_attribute(
            target, ev.currentTarget.parentElement.parentElement.dataset.attribute)
    }
}

/**
 * Activates the listeners for an attribute card
 * @param app: Sheet app
 * @param html: Html code
 */
export function activate_attribute_listeners(app, html) {
    let target = app.token?app.token:app.object;
    // We need a closure to hold data
    html.find('.attribute-label a').bindFirst('click', async ev => {
        await attribute_click_listener(ev, target);
    })
}


/**
 * Activate the listeners of the attribute card
 * @param message: Message date
 * @param html: Html produced
 */
export function activate_attribute_card_listeners(message, html) {
    html.find('#roll-button').click(_ =>{
        let actor = get_actor_from_message(message);
        let attribute = message.getFlag('betterrolls-swade', 'attribute_id',);
        roll_attribute(actor, attribute);
    })
}


/**
 * Roll an attribute showing the roll card
 * @param {SwadeActor, token} character
 * @param {string} attribute_id
 */
function roll_attribute(character, attribute_id){
    // If character is a token get true actor
    let actor = character.actor?character.actor:character;
    let roll = actor.rollAttribute(attribute_id, {suppressChat: true});
    let roll_mods = actor._buildTraitRollModifiers(
        actor.data.data.attributes[attribute_id], {});
    let flavour =
        `${game.i18n.localize(CONFIG.SWADE.attributes[attribute_id].long)} ${game.i18n.localize('SWADE.AttributeTest')}<br>`;
    roll_mods.forEach(mod => {
        const positive = parseInt(mod.value) > 0?'brsw-positive':'';
        flavour += `<span class="brsw-modifier ${positive}">${mod.label}: ${mod.value}</span>`;
    })
    roll.toMessage({speaker: ChatMessage.getSpeaker({ actor: actor }),
        flavor: flavour});
}
