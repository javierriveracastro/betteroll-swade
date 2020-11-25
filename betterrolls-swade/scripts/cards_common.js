// Common functions used in all cards

import {getWhisperData} from "./utils.js";

export const BRSW_CONST = {
    TYPE_ATTRIBUTE_CARD: 1,
    TYPE_RESULT_CARD: 100
};

/**
* Creates the basic chat data common to most cards
* @param {actor} actor:  The actor origin of the message
* @param {int} type: The type of message
* @return An object suitable to create a ChatMessage
*/
export function create_basic_chat_data(actor, type){
    let whisper_data = getWhisperData();
    // noinspection JSUnresolvedVariable
    let chatData = {
        user: game.user._id,
        content: '<p>Default content, likely an error in Better Rolls</p>',
        speaker: {
            actor: actor._idx,
            token: actor.token,
            alias: actor.name
        },
        type: type,
        blind: whisper_data.blind
    }
    if (whisper_data.whisper) {
        chatData.whisper = whisper_data.whisper
    }
    if (type === CONST.CHAT_MESSAGE_TYPES.ROLL) {
        chatData.roll = new Roll("0").roll();
        chatData.rollMode = whisper_data.rollMode;
    }
    // noinspection JSValidateTypes
    return chatData
}


/**
 * Get the actor from the message flag
 * @param {ChatMessage} message
 * @returns {actor|null|*}
 */
export function get_actor_from_message(message){
    if (message.getFlag('betterrolls-swade', 'actor')) {
        return  game.actors.get(message.getFlag('betterrolls-swade', 'actor'));
    } else if (message.getFlag('betterrolls-swade', 'token')) {
        if (! canvas) return; // When reloading the chat can be rendered before the canvas.
        let token = canvas.tokens.get(message.getFlag('betterrolls-swade', 'token'));
        return  token.actor;
    }
}


/**
 * Connects the listener for all chat cards
 * @param {ChatMessage} message
 * @param {string} html: html of the card
 */
export function activate_common_listeners(message, html) {
    // The message will be rendered at creation and each time a flag is added
    let actor = get_actor_from_message(message);
    // Actor will be undefined if this is called before flags are set
    if (actor){
        $(html).find('.brws-actor-img').addClass('bound').click(async () => {
            await manage_sheet(actor)
        });
    }
    // Selectable modifiers
    $(html).find('.brws-selectable').click((ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (ev.currentTarget.classList.contains('brws-selected')) {
            ev.currentTarget.classList.remove('brws-selected');
        } else {
            ev.currentTarget.classList.add('brws-selected');
        }
    })
    // Popout button
    $(html).find(".brsw-popup").click(() => {
        let popup = new ChatPopout(message);
        popup.render(true);
    })
}


/**
 * Controls the sheet status when the portrait in the header is clicked
 * @param {Actor} actor: The actor instance that created the chat card
 */
async function manage_sheet(actor) {
    if (actor.sheet.rendered) {
        // noinspection JSAccessibilityCheck
        if (actor.sheet._minimized) {
            await actor.sheet.maximize();
        } else {
            await actor.sheet.minimize();
        }
    } else {
            await actor.sheet.render(true);
    }
}


/**
 * Gets the expected action, whenever to show the card, do a system roll, etc,
 * from a click event and the settings
 * @param {event} event
 */
export function get_action_from_click(event){
    let setting_name = 'click'
    if (event.shiftKey) {
        setting_name = 'shift_click'
    } else if (event.ctrlKey) {
        setting_name = 'ctrl_click'
    } else if (event.altKey) {
        setting_name = 'alt_click'
    }
    return game.settings.get('betterrolls-swade', setting_name)
}


/**
 * Gets the roll options from the card html
 *
 * @param {string}html: Card html
 */
export function get_roll_options(html){
    let modifiers = []
    let tn = 4;
    $(html).find('.brws-selectable.brws-selected').each((_, element) => {
        if (element.dataset.type === 'modifier') {
            modifiers.push(element.dataset.value);
        } else if (element.dataset.type === 'tn') {
            tn = parseInt(element.dataset.value)
        }
    })
    return {additionalMods: modifiers, tn: tn}
}

/**
 * Try to detect if a roll is a fumble
 * @param {Roll} roll
 */
export function detect_fumble(roll) {
    let fumble = 0;
    // noinspection ES6MissingAwait
    roll.terms[0].rolls.forEach(partial_roll => {
        if (partial_roll.hasOwnProperty('result')) {
            // Extra rolling one dice
            // noinspection JSIncompatibleTypesComparison
            if (partial_roll.result === 1 && roll.terms[0].rolls.length === 1) {
                let test_fumble_roll = new Roll('1d6');
                test_fumble_roll.roll()
                test_fumble_roll.toMessage(
                    {flavor: game.i18n.localize('BRWS.Testing_fumbles')});
                // noinspection EqualityComparisonWithCoercionJS
                if (test_fumble_roll.result == 1) fumble=999;
            }
        } else {
            partial_roll.dice.forEach(die => {
                fumble += die.total === 1? 1: -1
            });
        }
    });
    console.log(fumble)
    return fumble > 0;
}