import {BRSW_CONST, create_basic_chat_data, create_render_options, get_actor_from_message} from "./cards_common.js";

import {make_item_footer} from "./item_card.js"

/**
* Creates a chat damage card for an item
*
* @param {Token, SwadeActor} origin  The actor or token owning the attribute
* @param {string} item_id The id of the item that we want to show
* @return A promise for the ChatMessage object
*/
export async function create_item_damage_card(origin, item_id) {
    const actor = origin.hasOwnProperty('actor')?origin.actor:origin;
    const item = actor.items.find(item => {return item.id === item_id});
    let chatData = create_basic_chat_data(actor, CONST.CHAT_MESSAGE_TYPES.IC);
    let footer = make_item_footer(item);
    const notes = item.data.data.notes || item.name;
    let render_object = create_render_options(
        actor, {actor: actor, header: {type: 'Damage', title: item.name,
            notes: notes, img: item.img}, footer: footer,
            description: item.data.data.description})
    chatData.content = await renderTemplate(
        "modules/betterrolls-swade/templates/damage_card.html", render_object);
    let message = await ChatMessage.create(chatData);
    await message.setFlag('betterrolls-swade', 'card_type',
        BRSW_CONST.TYPE_DMG_CARD)
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
export function damage_card_hooks() {
    game.brsw.create_item_damage_card = create_item_damage_card;
}


/**
 * Activate the listeners in the damage card
 * @param message: Message date
 * @param html: Html produced
 */
export function activate_damage_card_listeners(message, html) {
    html.find('.brsw-header-img').click(_ => {
        const actor = get_actor_from_message(message);
        const item = actor.getOwnedItem(message.getFlag(
            'betterrolls-swade', 'item_id'));
        item.sheet.render(true);
    });
}
