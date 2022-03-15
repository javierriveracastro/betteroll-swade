// functions for the unshake and maybe un-stun card //
/* globals canvas, game, CONST */

import {get_owner} from "./damage_card.js";
import {apply_status, BRSW_CONST, BRWSRoll, create_common_card, get_actor_from_message,
    roll_trait, spend_bennie, update_message} from "./cards_common.js";
import {status_footer} from "./incapacitation_card.js";

/**
 * Shows the unshaken card
 * @param {SwadeActor} actor
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
 * Activate the listeners of the unshake card
 * @param message: Message data
 * @param html: Html produced
 */
export function activate_unshake_card_listeners(message, html) {
    html.find('.brsw-spirit-button, .brsw-roll-button').click((ev) =>{
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
 * @param {Boolean} use_bennie
 */
async function roll_unshaken(message, use_bennie) {
    const render_data = message.getFlag('betterrolls-swade2',
        'render_data');
    const actor = get_actor_from_message(message);
    if (use_bennie) {
        // remove shaken
        await spend_bennie(actor)
        render_data.text = game.i18n.localize("BRSW.UnshakeBennie")
        await apply_status(actor, 'shaken', false)
    } else {
        // Make the roll
        const roll = await roll_trait(message,
            actor.data.data.attributes.spirit, game.i18n.localize("BRSW.SpiritRoll"),
            '', {});
        let result = 0;
        roll.rolls.forEach(roll => {
            result = Math.max(roll.result, result);
        })
        if (result >= 4) {
            render_data.text = game.i18n.localize("BRSW.UnshakeSuccessfulRoll")
            await apply_status(actor, 'shaken', false)
        } else {
            render_data.text = game.i18n.localize("BRSW.UnshakeFailure")
        }
    }
    await update_message(message, actor, render_data);
}