// Functions for cards representing all items but skills

import {BRSW_CONST, create_basic_chat_data, create_render_options
    } from "./cards_common.js";

/**
* Creates a chat card for an item
*
* @param {Token, SwadeActor} origin  The actor or token owning the attribute
* @param {string} item_id The id of the item that we want to show
* @return A promise for the ChatMessage object
*/
async function create_item_card(origin, item_id) {
    const actor = origin.hasOwnProperty('actor')?origin.actor:origin;
    const item = actor.items.find(item => {return item.id === item_id});
    let chatData = create_basic_chat_data(actor, CONST.CHAT_MESSAGE_TYPES.IC);
    let render_object = create_render_options(
        actor, {actor: actor, header: {type: 'Item', title: item.name,
            notes: 'notes', img: item.img}, footer: [],
            description: item.data.data.description})
    chatData.content = await renderTemplate(
        "modules/betterrolls-swade/templates/item_card.html", render_object);
    let message = await ChatMessage.create(chatData);
    await message.setFlag('betterrolls-swade', 'card_type',
        BRSW_CONST.TYPE_ITEM_CARD)
    await message.setFlag('betterrolls-swade', 'item_id',
        item_id)
    // We always set the actor (as a fallback, and the token if possible)
    await message.setFlag('betterrolls-swade', 'actor',
            actor.id)
    if (actor !== origin) {
        // noinspection JSUnresolvedVariable
        await message.setFlag('betterrolls-swade', 'token',
            origin.id)
    }
    return message;
}

/**
 * Hooks the public functions to a global object
 */
export function item_card_hooks() {
    game.brsw.create_item_card = create_item_card;
}
