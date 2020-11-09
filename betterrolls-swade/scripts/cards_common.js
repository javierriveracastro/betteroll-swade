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
    let actor;
    if (message.getFlag('betterrolls-swade', 'actor')) {
        actor = game.actors.get(message.getFlag('betterrolls-swade', 'actor'));
    } else {
        let token = canvas.tokens.get(message.getFlag('betterrolls-swade', 'token'));
        actor = token.actor;
    }
    console.log(message)
    $(html).find('.brws-actor-img').click(async () => {
        await manage_sheet(actor)
    });
}


/**
 * Controls the sheet status when the portrait in the header is clicked
 * @param {Actor} actor: The actor instance that created the chat card
 */
async function manage_sheet(actor) {
    console.log(actor)
    console.log(actor.sheet)
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