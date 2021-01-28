// Functions for the damage card


import {BRSW_CONST, BRWSRoll, create_common_card} from "./cards_common.js";

/**
 * Shows a damage card and applies damage to the token/actor
 * @param {string} token_id
 * @param {int} damage
 * @param {string} damage_text
 */
export async function create_damage_card(token_id, damage, damage_text) {
    let token = canvas.tokens.get(token_id);
    let actor = token.actor;
    let user = get_owner(actor);
    let text = await apply_damage(token, damage);
    let footer = [`${game.i18n.localize("SWADE.Wounds")}: ${actor.data.data.wounds.value}/${actor.data.data.wounds.max}`]
    for (let status in actor.data.data.status) {
        // noinspection JSUnfilteredForInLoop
        if (actor.data.data.status[status]) {
            footer.push(status.slice(2));
        }
    }
    let trait_roll = new BRWSRoll();
    let message = await create_common_card(actor,
    {header: {type: game.i18n.localize("SWADE.Dmg"),
            title: game.i18n.localize("SWADE.Dmg"),
            notes: damage_text}, text: text, footer: footer,
            trait_roll: trait_roll}, CONST.CHAT_MESSAGE_TYPES.IC,
    "modules/betterrolls-swade2/templates/damage_card.html")
    await message.setFlag('betterrolls-swade2', 'card_type',
        BRSW_CONST.TYPE_DMG_CARD)
    return message
    // TODO: Undo damage
    // TODO: Soak rolls
    // TODO: Remove conditions from footer???
}


function get_owner(actor) {
    let player;
    let gm;
    game.users.forEach(user => {
        if (user.isGM) {
            gm = user
        } else {
            if (user.character && user.character.id === actor.id) {
                player = user
            }
        }
    })
    return player || gm;
}

/**
 * Applies damage to a token
 * @param token
 * @param damage
 */
async function apply_damage(token, damage) {
    if (damage < 0) return;
    if (!token.hasOwnProperty('actor')) {
        // If this is not a token then it is a token id
        token = canvas.tokens.get(token);
    }
    let wounds = Math.floor(damage / 4);
    // noinspection JSUnresolvedVariable
    if (wounds < 1 && token.actor.data.data.status.isShaken) {
        // Shaken twice
        wounds = 1;
    }
    const final_wounds = token.actor.data.data.wounds.value + wounds;
    if (final_wounds > token.actor.data.data.wounds.max) {
        await token.actor.update({'data.wounds.value': token.actor.data.data.wounds.max});
    } else {
        await token.actor.update({'data.wounds.value': final_wounds});
    }
    await token.actor.update({'data.status.isShaken': true});
    // noinspection JSIgnoredPromiseFromCall
    return  wounds ? `${wounds} wound(s) has been added to ${token.name}` :
            `${token.name} is now shaken`;
}