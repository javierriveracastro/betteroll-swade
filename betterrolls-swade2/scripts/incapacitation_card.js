// functions for the incapacitation card

import {
    BRSW_CONST,
    BRWSRoll,
    create_common_card,
    get_actor_from_message,
    roll_trait,
    spend_bennie, update_message
} from "./cards_common.js";
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
    const text = game.i18n.format("BRSW.IncapacitatedText",
        {token_name: token.name});
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
    {header: {type: '',
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

/**
 * Activate the listeners of the incapacitation card card
 * @param message: Message date
 * @param html: Html produced
 */
export function activate_incapacitation_card_listeners(message, html) {
    html.find('.brsw-vigor-button, .brsw-roll-button').click((ev) =>{
        let spend_bennie = false
        if (ev.currentTarget.classList.contains('roll-bennie-button')) {
            spend_bennie=true
        }
        // noinspection JSIgnoredPromiseFromCall
        roll_incapacitation(message, spend_bennie);
    });
}



/**
 * Males a vigor incapacitation roll
 * @param {ChatMessage} message
 * @param {boolean} spend_benny
 */
async function roll_incapacitation(message, spend_benny) {
    const render_data = message.getFlag('betterrolls-swade2',
        'render_data');
    const actor = get_actor_from_message(message)
    if (spend_benny) {
        await spend_bennie(actor);
    }
    const token = message.getFlag('betterrolls-swade2', 'token');
    const roll = await roll_trait(message,
        actor.data.data.attributes.vigor, game.i18n.localize("BRSW.IncapacitationRoll"), '', {});
    let result = 0;
    roll.rolls.forEach(roll => {
        result = Math.max(roll.result, result);
    })
    roll.old_rolls.forEach(old_roll => {
        if (old_roll) {
            old_roll.forEach(roll => {
                result = Math.max(roll.result, result);
            });
        }
    })
    if (roll.is_fumble) {
        render_data.text_after = `</p><p>${game.i18n.localize("BRSW.Fumble")}</p><p>${token.name} ${game.i18n.localize("BRSW.IsDead")}</p>`
    } else if (result < 4) {
        render_data.text_after = game.i18n.localize("BRSW.BleedingOutResult")
    } else if (result < 8) {
        render_data.text_after = game.i18n.localize("BRSW.TempInjury")
    } else {
        render_data.text_after = game.i18n.localize("BRSW.TempInjury24")
    }
    await update_message(message, actor, render_data);
}