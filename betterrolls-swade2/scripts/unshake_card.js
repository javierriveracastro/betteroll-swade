// functions for the unshake and maybe un-stun card //
/* globals canvas, game, CONST */

import {get_owner} from "./damage_card.js";
import {BRSW_CONST, BRWSRoll, create_common_card} from "./cards_common.js";
import {status_footer} from "./incapacitation_card.js";

/**
 * Shows the unshaken card
 * @param {string} token_id As it comes from damage its target is always a token
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