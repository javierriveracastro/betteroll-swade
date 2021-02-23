// functions for the incapacitation card

import {BRSW_CONST, BRWSRoll, create_common_card} from "./cards_common.js";
import {get_owner} from "./damage_card.js";

/**
 * Shows a incapacitation card an
 * @param {string} token_id As it comes from damage its target is always a token
 */
export async function create_incapacitation_card(token_id) {
    let token = canvas.tokens.get(token_id);
    let actor = token.actor;
    let user = get_owner(actor);
    // noinspection JSUnresolvedVariable
    const text = game.i18n.format("BRSW.IncapacitatedText");
    const text_after = game.i18n.localize("BRSW.IncapacitatedMustVigor")
    let footer = [`${game.i18n.localize("SWADE.Wounds")}: ${actor.data.data.wounds.value}/${actor.data.data.wounds.max}`]
    for (let status in actor.data.data.status) {
        // noinspection JSUnfilteredForInLoop
        if (actor.data.data.status[status]) {
            // noinspection JSUnfilteredForInLoop
            footer.push(status.slice(2));
        }
    }
    let trait_roll = new BRWSRoll();
    let message = await create_common_card(token,
    {header: {type: game.i18n.localize("BRSW.Incapacitation"),
        title: game.i18n.localize("BRSW.Incapacitation"),
        notes: token.name}, text: text, text_after: text_after,
        footer: footer, trait_roll: trait_roll},
        CONST.CHAT_MESSAGE_TYPES.IC,
    "modules/betterrolls-swade2/templates/incapacitation_card.html")
    await message.update({user: user._id});
    await message.setFlag('betterrolls-swade2', 'attribute_id', 'vigor');
    await message.setFlag('betterrolls-swade2', 'card_type',
        BRSW_CONST.TYPE_INC_CARD)
    return message
}
