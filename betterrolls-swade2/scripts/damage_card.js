// Functions for the damage card
import {
    BRSW_CONST, BRWSRoll, create_common_card, get_actor_from_message, are_bennies_available,
    roll_trait, spend_bennie} from "./cards_common.js";


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
    // noinspection JSUnresolvedVariable
    let undo_values = {wounds: actor.data.data.wounds.value,
        shaken: actor.data.data.status.isShaken};
    let text = await apply_damage(token, damage);
    let footer = [`${game.i18n.localize("SWADE.Wounds")}: ${actor.data.data.wounds.value}/${actor.data.data.wounds.max}`]
    for (let status in actor.data.data.status) {
        // noinspection JSUnfilteredForInLoop
        if (actor.data.data.status[status]) {
            // noinspection JSUnfilteredForInLoop
            footer.push(status.slice(2));
        }
    }
    let trait_roll = new BRWSRoll();
    let message = await create_common_card(actor,
    {header: {type: game.i18n.localize("SWADE.Dmg"),
        title: game.i18n.localize("SWADE.Dmg"),
        notes: damage_text}, text: text, footer: footer, undo_values: undo_values,
        trait_roll: trait_roll,
        soak_possible: (actor.isWildcard && are_bennies_available(actor) && damage > 3)},
        CONST.CHAT_MESSAGE_TYPES.IC,
    "modules/betterrolls-swade2/templates/damage_card.html")
    await message.update({user: user._id});
    await message.setFlag('betterrolls-swade2', 'attribute_id', 'vigor');
    await message.setFlag('betterrolls-swade2', 'card_type',
        BRSW_CONST.TYPE_DMG_CARD)
    return message
    // TODO: Soak rolls
    // TODO: Remove conditions from footer???
}


/**
 * Gets the owner of an actor
 * @param {SwadeActor} actor
 */
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


/**
 * Undo the damage in one card
 * @param {ChatMessage} message
 */
async function undo_damage(message){
    console.log(message)
    const actor = get_actor_from_message(message);
    const render_data = message.getFlag('betterrolls-swade2',
        'render_data');
    console.log(render_data)
    await actor.update({"data.wounds.value": render_data.undo_values.wounds,
        "data.status.isShaken": render_data.undo_values.shaken});
    await message.delete();
}


/**
 * Activate the listeners of the damage card
 * @param message: Message date
 * @param html: Html produced
 */
export function activate_damage_card_listeners(message, html) {
    html.find('.brsw-undo-damage').click(async () =>{
        await undo_damage(message);
    });
    html.find('.brsw-soak-button').click(() =>{
        roll_soak(message);
    });
}

/**
 * Males a soak roll
 * @param {ChatMessage} message
 */
async function roll_soak(message) {
    // TODO: Save somewhere the wounds made.
    // TODO: Use this wounds in the modifier
    // TODO: Apply results of the soak roll and store them
    // TODO: Manage rerolls.
    const actor = get_actor_from_message(message);
    await spend_bennie(actor);
    await roll_trait(message, actor.data.data.attributes.vigor, game.i18n.localize(
        "BRSW.SoakRoll"), '',
        {modifiers:[{name: game.i18n.localize("BRSW.RemoveWounds"),
            value: 2}]});
}