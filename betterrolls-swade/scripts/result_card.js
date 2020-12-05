// Functions for the card presenting results

import {BRSW_CONST, create_basic_chat_data} from "./cards_common.js";
import {broofa} from "./utils.js";


/// TRAIT RESULT CARD

/**
 * Create and show a basic result chat card
 * @param {SwadeActor} actor: The actor who made the action that activates this
 *  result card
 *  @param {Array} results: Array with the results of the roll
 *  @param {int} modifier: Modifiers
 *  @param {int} tn: Target number
 *  @param {int} rof: Number of trait dice rolled
 */
export async function create_result_card (actor, results, modifier, tn, rof){
    const result_card_option = game.settings.get('betterrolls-swade',
        'result-card');
    if (result_card_option === 'none') return;
    // Ges results before modifier
    let flat_rolls = [];
    if (rof ===1 && ! actor.isWildcard) {
        // For a reason that I don't want to investigate, non wildcards,
        // rof 1 rolls when explode don't aggregate the results
        let roll_value = 0;
        results.forEach(result => {
            roll_value += result;
        })
        flat_rolls.push({die_roll: roll_value, id: broofa()});
    } else {
        // Wildcards and extras who roll multiple dice
        results.forEach(result => {
            if (typeof result === 'string') {
                // This is likely a mod to the last roll
                flat_rolls[flat_rolls.length - 1].die_roll += parseInt(result);
            } else {
                // This is a new roll
                flat_rolls.push({die_roll: result - modifier, id: broofa()});
            }
        });
    }
    // Create chat card
    let chatData = create_basic_chat_data(actor, CONST.CHAT_MESSAGE_TYPES.OOC);
    if (result_card_option === 'master') {
        chatData.blind = true;
    }
    chatData.content = await renderTemplate(
    "modules/betterrolls-swade/templates/result_card.html",
    {flat_rolls: flat_rolls, modifier: modifier, target_number: tn});
    let message =  await ChatMessage.create(chatData);
    await message.setFlag('betterrolls-swade', 'card_type',
        BRSW_CONST.TYPE_RESULT_CARD)
    // Calculate initial results
    flat_rolls.forEach(roll => {
        calculate_result(roll.id);
    })
    return message
}


/**
 * Activate the listeners on the result card
 * @param {string}html: the html code of the card
 */
export function activate_result_card_listeners(html) {
    $(html).find('.brsw-bar-input').blur(async ev => {
        await calculate_result(ev.currentTarget.dataset.id)
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
 * Calculates the results of a roll
 * @param {string} result_id: The id of the result
 */
function calculate_result(result_id){
    let result_data = recover_result_data(result_id);
    let result = result_data.die_roll + result_data.modifier -
        result_data.target_number;
    result = result / 4;
    let result_div = $(`#div${result_id}`)
    if (result < 0) {
        result_div.text(game.i18n.localize('BRSW.Failure'));
    } else if (result < 1) {
        result_div.text(game.i18n.localize('BRSW.Success'));
    } else {
        result_div.text(
            result < 2 ? game.i18n.localize('BRSW.Raise') : `${Math.floor(result)} ${game.i18n.localize('BRSW.Raise_plural')}`);
    }
}

//// FUMBLE CARD

/**
 * Create and show a fumble card
 * @param {SwadeActor} actor: The poor actor who had critically failed
 */
export async function show_fumble_card(actor){
    const result_card_option = game.settings.get('betterrolls-swade',
        'result-card');
    if (result_card_option === 'none') return;
    let chatData = create_basic_chat_data(actor, CONST.CHAT_MESSAGE_TYPES.OOC);
    if (result_card_option === 'master') {
        chatData.blind = true;
    }
    chatData.content = await renderTemplate(
    "modules/betterrolls-swade/templates/fumble_card.html",
    {});
    return   await ChatMessage.create(chatData);
}