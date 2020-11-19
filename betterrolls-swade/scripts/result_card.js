// Functions for the card presenting results

import {create_basic_chat_data} from "./cards_common.js";

/**
 * Create and show a basic result chat card
 * @param {actor} actor: The actor who made the action that activates this
 *  result card
 */
export async function create_result_card (actor){
    const result_card_option = game.settings.get('betterrolls-swade',
        'result-card');
    if (result_card_option === 'none') return;
    let chatData = create_basic_chat_data(actor, CONST.CHAT_MESSAGE_TYPES.OOC);
    if (result_card_option === 'master') {
        chatData.blind = true;
    }
    chatData.content = await renderTemplate(
    "modules/betterrolls-swade/templates/result_card.html",
    {});
    return  await ChatMessage.create(chatData);
}