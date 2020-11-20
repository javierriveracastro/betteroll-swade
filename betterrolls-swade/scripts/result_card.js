// Functions for the card presenting results

import {create_basic_chat_data} from "./cards_common.js";

/**
 * Create and show a basic result chat card
 * @param {actor} actor: The actor who made the action that activates this
 *  result card
 *  @param {Array} results: Array with the results of the roll
 *  @param {int} modifier: Modifiers
 */
export async function create_result_card (actor, results, modifier){
    const result_card_option = game.settings.get('betterrolls-swade',
        'result-card');
    if (result_card_option === 'none') return;
    // Ges results before modifier
    const flat_rolls = [];
    results.forEach(result => {
        flat_rolls.push(result - modifier);
    })
    // Create chat card
    let chatData = create_basic_chat_data(actor, CONST.CHAT_MESSAGE_TYPES.OOC);
    if (result_card_option === 'master') {
        chatData.blind = true;
    }
    chatData.content = await renderTemplate(
    "modules/betterrolls-swade/templates/result_card.html",
    {flat_rolls: flat_rolls, modifier: modifier, target_number: 4});
    return  await ChatMessage.create(chatData);
}