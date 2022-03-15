// functions for the unshake and maybe un-stun card //
/* globals canvas, game, CONST */

import {get_owner} from "./damage_card.js";
import {BRSW_CONST, BRWSRoll, create_common_card} from "./cards_common.js";
import {create_incapacitation_card, create_injury_card, status_footer} from "./incapacitation_card.js";

/**
 * Shows the unshaken card
 * @param {Actor} actor
 */
export async function create_unshaken_card(actor) {
    if (! actor.data.data.status.isShaken) {return}
    let user = get_owner(actor);
    // noinspection JSUnresolvedVariable
    const text = game.i18n.format("BRSW.UnshakenText",
        {token_name: actor.name});
    let footer = status_footer(actor)
    let trait_roll = new BRWSRoll();
    let message = await create_common_card(actor,
    {header: {type: '',
        title: game.i18n.localize("BRSW.Unshake"),
        notes: actor.name}, text: text, footer: footer, trait_roll: trait_roll,
        show_roll_injury: false, attribute_name: 'vigor'}, CONST.CHAT_MESSAGE_TYPES.IC,
    "modules/betterrolls-swade2/templates/unshaken_card.html")
    await message.update({user: user.id});
    await message.setFlag('betterrolls-swade2', 'card_type',
        BRSW_CONST.TYPE_UNSHAKE_CARD)
    return message
}

/**
 * Activate the listeners of the unshke card
 * @param message: Message data
 * @param html: Html produced
 */
export function activate_unshake_card_listeners(message, html) {
    html.find('.brsw-spirit-button').click((ev) =>{
        let spend_bennie = false
        if (ev.currentTarget.classList.contains('roll-bennie-button') ||
                ev.currentTarget.classList.contains('brsw-soak-button')) {
            spend_bennie=true
        }
        // noinspection JSIgnoredPromiseFromCall
        roll_unshaken(message, spend_bennie);
    });
}


/**
 * Checks if a benny has been expended and rolls to remove shaken
 * @param {ChatMessage} message
 * @param {Boolean} spend_bennie
 */
function roll_unshaken(message, spend_bennie) {
    if (spend_bennie) {
        // remove shaken
        console.log("Bennie expended")
    } else {
        // Make the roll
        console.log("Rolled")
    }
}