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
    chatData.content = await renderTemplate(
        "modules/betterrolls-swade/templates/attribute_card.html",
        {actor: actor, header: {type: 'Attribute', title: name}});
    let message = await ChatMessage.create(chatData);
    await message.setFlag('betterrolls-swade', 'card_type',
        BRSW_CONST.TYPE_ATTRIBUTE_CARD)
    await message.setFlag('betterrolls-swade', 'actor',
            actor)
    return message
}

/**
 * Hooks the public functions to a global object
 */
export function attribute_card_hooks() {
    game.brsw.create_atribute_card = create_attribute_card;
}
