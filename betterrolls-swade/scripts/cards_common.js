// Common functions used in all cards

import {getWhisperData} from "./utils.js";

export const BRSW_CONST = {
    TYPE_ATTRIBUTE_CARD: 1,
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
 * Connects the listener for all chat cards
 * @param {ChatMessage} message
 * @param {string} html: html of the card
 */
export function activate_common_listeners(message, html) {
    // The message will be rendered at creation and each time a flag is added
    let actor;
    if (message.getFlag('betterrolls-swade', 'actor')) {
        actor = game.actors.get(message.getFlag('betterrolls-swade', 'actor'));
    } else if (message.getFlag('betterrolls-swade', 'token')) {
        let token = canvas.tokens.get(message.getFlag('betterrolls-swade', 'token'));
        actor = token.actor;
    }
    // Actor will be undefined if this is called before flags are set
    if (actor){
        $(html).find('.brws-actor-img').addClass('bound').click(async () => {
            await manage_sheet(actor)
        });
    }
}


/**
 * Controls the sheet status when the portrait in the header is clicked
 * @param {Actor} actor: The actor instance that created the chat card
 */
async function manage_sheet(actor) {
    if (actor.sheet.rendered) {
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