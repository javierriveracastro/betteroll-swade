// Functions for the card presenting results

import {BRSW_CONST, create_basic_chat_data} from "./cards_common.js";
import {broofa} from "./utils.js";

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
    let flat_rolls = [];
    results.forEach(result => {
        flat_rolls.push({die_roll: result - modifier, id: broofa()});
    })
    // Create chat card
    let chatData = create_basic_chat_data(actor, CONST.CHAT_MESSAGE_TYPES.OOC);
    if (result_card_option === 'master') {
        chatData.blind = true;
    }
    chatData.content = await renderTemplate(
    "modules/betterrolls-swade/templates/result_card.html",
    {flat_rolls: flat_rolls, modifier: modifier, target_number: 4});
    let message =  await ChatMessage.create(chatData);
    await message.setFlag('betterrolls-swade', 'card_type',
        BRSW_CONST.TYPE_RESULT_CARD)
    return message
}


/**
 * Activate the listeners on the result card
 * @param {string}html: the html code of the card
 */
export function activate_result_card_listeners(html) {
    $(html).find('.brsw-bar-input').blur(async ev => {
        await input_changes(ev)
    })
}


/**
 * Recovers the dice result, modifier an tn from an result card
 * @param {string} id: Id of the roll.
 */
function recover_result_data(id) {
    let die_roll = parseInt($(`#die${id}`).val());
    let modifier = parseInt($(`#mod${id}`).val());
    let target_number = parseInt($(`#tn${id}`).val());
    return {die_roll: die_roll, modifier: modifier, target_number: target_number};
}


/**
 * This should be executed when any input of the result row changes
 * @param event
 */
function input_changes(event){
    console.log(recover_result_data(event.currentTarget.dataset.id))
}