// Functions for cards representing attributes

import {create_basic_chat_data, BRSW_CONST} from "./cards_common.js";

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
    let modifier = actor.data.data.attributes[name.toLowerCase()].die.modifier;
    if (parseInt(modifier)) {
        modifier = " " + (modifier.slice(0, 1) === '-'?modifier:'+' + modifier);
        notes = notes + modifier;
    }
    chatData.content = await renderTemplate(
        "modules/betterrolls-swade/templates/attribute_card.html",
        {actor: actor, header: {type: 'Attribute', title: name,
            notes: notes}});
    let message = await ChatMessage.create(chatData);
    await message.setFlag('betterrolls-swade', 'card_type',
        BRSW_CONST.TYPE_ATTRIBUTE_CARD)
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
