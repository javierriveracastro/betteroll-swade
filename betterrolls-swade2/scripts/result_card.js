// Functions for the card presenting results

import {BRSW_CONST, create_basic_chat_data, create_render_options} from "./cards_common.js";
import {broofa} from "./utils.js";
import {roll_attribute} from "./attribute_card.js";
import {roll_skill} from "./skill_card.js";
import {roll_item, roll_dmg} from "./item_card.js";


/// TRAIT RESULT CARD

/**
 * Create and show a basic result chat card
 * @param {SwadeActor} actor: The actor who made the action that activates this
 *  result card
 *  @param {Array} results: Array with the results of the roll
 *  @param {int} modifier: Modifiers
 *  @param {string} origin_id: Id of the originating message
 *  @param origin_options: Options in the originating roll
 */
export async function create_result_card(actor, results, modifier,
                                          origin_id, origin_options){
    const result_card_option = game.settings.get('betterrolls-swade2',
        'result-card');
    if (result_card_option === 'none') return;
    // Ges results before modifier
    let flat_rolls = [];
    if (origin_options.rof ===1 && ! actor.isWildcard) {
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
    const render_options = create_render_options(
        actor, {flat_rolls: flat_rolls, modifier: modifier,
        target_number: origin_options.tn})
    // Always damage (temporal)
    render_options.damage = true;
    render_options.ap = origin_options.ap;
    render_options.target_armor = origin_options.target_armor || 0;
    chatData.content = await renderTemplate(
    "modules/betterrolls-swade2/templates/result_card.html", render_options);
    let message =  await ChatMessage.create(chatData);
    await message.setFlag('betterrolls-swade2', 'origin_message',
        origin_id);
    await message.setFlag('betterrolls-swade2', 'origin_options',
        origin_options);
    await message.setFlag('betterrolls-swade2', 'card_type',
        BRSW_CONST.TYPE_RESULT_CARD);
    return message
}


/**
 * Activate the listeners on the result card
 * @param {ChatMessage} message
 * @param {string}html: the html code of the card
 */
export function activate_result_card_listeners(message, html) {
    html = $(html);
    // noinspection JSUnresolvedFunction
    html.find('.brsw-bar-input').blur(async ev => {
        await calculate_result(ev.currentTarget.dataset.id, '')
    });
    // Initial calculations
    // noinspection JSUnresolvedFunction
    html.find('.brsw-result-text').each((_, roll) => {
        calculate_result(roll.id.slice(3), html);
    })
    // noinspection JSUnresolvedFunction
    html.find('#roll-button, #roll-bennie-button').click(async ev =>{
        reroll_clicked(message, ev.currentTarget.id.includes('bennie'));
    })
    // noinspection JSUnresolvedFunction
    html.find('.brsw-apply-damage-button').click(apply_damage_tokens);
}


/**
 * Called when any reroll button is clicked.
 * @param {ChatMessage} message
 * @param {boolean} use_bennie
 */
function reroll_clicked(message, use_bennie) {
    const origin_message_id = message.getFlag('betterrolls-swade2',
        'origin_message');
    const origin_options = message.getFlag('betterrolls-swade2', 'origin_options')
    const origin_message = game.messages.find(message => {
        return message.id === origin_message_id;
    });
    const origin_type = origin_message.getFlag('betterrolls-swade2', 'card_type');
    if (origin_type === BRSW_CONST.TYPE_ATTRIBUTE_CARD) {
        // noinspection JSIgnoredPromiseFromCall
        roll_attribute(origin_message, '', use_bennie);
    } else if (origin_type === BRSW_CONST.TYPE_SKILL_CARD) {
        // noinspection JSIgnoredPromiseFromCall
        roll_skill(origin_message, '', use_bennie);
    } else if (origin_type === BRSW_CONST.TYPE_ITEM_CARD) {
        // noinspection JSIgnoredPromiseFromCall
        roll_dmg(origin_message, '', use_bennie, origin_options,
            origin_options.raise);
    } else if (origin_type === BRSW_CONST.TYPE_DMG_CARD) {
        // noinspection JSIgnoredPromiseFromCall
        roll_dmg(origin_message, '', use_bennie, origin_options,
            origin_options.raise);
    }
}


/**
 * Recovers the dice result, modifier an tn from an result card
 * @param {string} id: Id of the roll.
 */
function recover_result_data(id) {
    let die_roll = parseInt($(`#die${id}`).val());
    let modifier = parseInt($(`#mod${id}`).val());
    let target_number = parseInt($(`#tn${id}`).val());
    let ap = parseInt($(`#ap${id}`).val());
    let target_armor = parseInt($(`#ar${id}`).val());
    return {die_roll: die_roll, modifier: modifier, target_number: target_number,
        ap: ap, target_armor: target_armor};
}


/**
 * Calculates the results of a roll
 * @param {string} result_id: The id of the result
 * @param {string} html: If it exist we only check this html
 */
function calculate_result(result_id, html){
    // noinspection JSUnresolvedFunction
    let is_damage = html ? html.find('.brsw-damage-result' + result_id).length :
        $('.brsw-damage-result' + result_id).length;
    let result_data = recover_result_data(result_id);
    let result = result_data.die_roll + result_data.modifier -
        result_data.target_number;
    if (result_data.ap && result_data.target_armor) {
        // AP could mean extra damage if the target has armor
        result += Math.min(result_data.ap, result_data.target_armor);
    }
    result = result / 4;
    const result_strings = [game.i18n.localize('BRSW.Failure')]
    if (is_damage) {
        // "Damage Result"
        result_strings.push(game.i18n.localize('BRSW.Shaken'));
        result_strings.push(game.i18n.localize('BRSW.Wound'));
        result_strings.push(game.i18n.localize('BRSW.Wounds'));
        // Put result into buttons data
    } else {
        // "Trait result"
        result_strings.push(game.i18n.localize('BRSW.Success'));
        result_strings.push(game.i18n.localize('BRSW.Raise'));
        result_strings.push(game.i18n.localize('BRSW.Raise_plural'));
    }
    // noinspection JSUnresolvedFunction
    let result_div = html ? html.find(`#div${result_id}`) : $(`#div${result_id}`);
    result_div[0].dataset.resultvalue = result.toString();
    if (result < 2) {
        result_div.text(result_strings[Math.floor(result) + 1]);
    } else {
        result_div.text(Math.floor(result) + " " + result_strings[3]);
    }
}

//// FUMBLE CARD

/**
 * Create and show a fumble card
 * @param {SwadeActor} actor: The poor actor who had critically failed
 */
export async function show_fumble_card(actor){
    const result_card_option = game.settings.get('betterrolls-swade2',
        'result-card');
    if (result_card_option === 'none') return;
    let chatData = create_basic_chat_data(actor, CONST.CHAT_MESSAGE_TYPES.OOC);
    if (result_card_option === 'master') {
        chatData.blind = true;
    }
    chatData.content = await renderTemplate(
    "modules/betterrolls-swade2/templates/fumble_card.html",
    {});
    return   await ChatMessage.create(chatData);
}


/// APPLY DAMAGE

/**
 * Apply damage to selected or targeted of tokens
 *
 * @param ev: Click event
 */
function apply_damage_tokens(ev) {
    const result_id = ev.currentTarget.dataset.id;
    const result = $(`#div${result_id}`)[0].dataset.resultvalue;
    let tokens;
    if (ev.currentTarget.classList.contains('brsw-selected')) {
        tokens = canvas.tokens.controlled;
    } else {
        tokens = game.user.targets;
    }
    tokens.forEach(token => {
        apply_damage(token, parseFloat(result));
    })
}


function apply_damage(token, damage) {
    if (damage < 0) return;
    let wounds = Math.floor(damage);
    // noinspection JSUnresolvedVariable
    if (damage < 1 && token.actor.data.data.status.isShaken) {
        // Shaken twice
        wounds = 1;
    }
    const final_wounds = token.actor.data.data.wounds.value + wounds;
    if (final_wounds > token.actor.data.data.wounds.max) {
        token.actor.update({'data.wounds.value': token.actor.data.data.wounds.max});
    } else {
        token.actor.update({'data.wounds.value': final_wounds});
    }
    token.actor.update({'data.status.isShaken': true});
    // noinspection JSIgnoredPromiseFromCall
    ChatMessage.create({
        speaker: {
            alias: token.name
        },
        content: wounds ? `${wounds} wound(s) has been added to ${token.name}` :
            `${token.name} is now shaken`
    });
}