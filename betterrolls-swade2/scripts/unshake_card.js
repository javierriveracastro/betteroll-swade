// functions for the unshake and maybe un-stun card //
/* globals canvas, game, CONST, Hooks */

import {get_owner} from "./damage_card.js";
import {apply_status, BRSW_CONST, BRWSRoll, create_common_card, get_actor_from_message,
    roll_trait, spend_bennie, update_message} from "./cards_common.js";
import {status_footer} from "./incapacitation_card.js";

/**
 * Shows the unshaken card
 * @param {ChatMessage} original_message
 */
export async function create_unshaken_card(original_message) {
    let actor = get_actor_from_message(original_message)
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
    await message.setFlag('betterrolls-swade2', 'token',
        original_message.getFlag('betterrolls-swade2', 'token'))
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
        render_data.text = game.i18n.format("BRSW.UnshakeBennie", {name: actor.name})
        await apply_status(actor, 'shaken', false)
    } else {
        // Check for Edges & Abilities
        const modifiers = await check_abilities(actor)
        // Make the roll
        const roll = await roll_trait(message,
            actor.data.data.attributes.spirit, game.i18n.localize("BRSW.SpiritRoll"),
            '', {modifiers: modifiers});
        let result = 0;
        roll.rolls.forEach(roll => {
            result = Math.max(roll.result, result);
        })
        if (result >= 4) {
            if (game.settings.get('betterrolls-swade2', 'swd-unshake') === true && result < 8) {
                render_data.text = game.i18n.format("BRSW.UnshakeSuccessfulRollSWD", {name: actor.name})
            } else {
                render_data.text = game.i18n.format("BRSW.UnshakeSuccessfulRoll", {name: actor.name})
            }
            await apply_status(actor, 'shaken', false)
        } else {
            render_data.text = game.i18n.format("BRSW.UnshakeFailure", {name: actor.name})
        }
    }
    await update_message(message, actor, render_data);
    Hooks.call("BRSW-Unshake", message, actor)
}

async function check_abilities(actor) {
    let edgeAndAbilityNames = [
        game.i18n.localize("BRSW.EdgeName-CombatReflexes"), // index #0
        game.i18n.localize("BRSW.AbilityName-Demon_Hellfrost"), // index #1
        game.i18n.localize("BRSW.AbilityName-Construct"), // index #2
        game.i18n.localize("BRSW.AbilityName-Undead"), // index #3
        game.i18n.localize("BRSW.AbilityName-Amorphous_theAfter") // index #4
    ]
    // Making all lower case:
    edgeAndAbilityNames = edgeAndAbilityNames.map(name => name.toLowerCase())
    // Check if these have an AE (using .entries() to not loose the index):
    for (let [index, value] of edgeAndAbilityNames.entries()) {
        let effect = actor.effects.find(ae => ae.data.label.toLowerCase() === value)
        // Only splice if the AE affects the generic bonus:
        let affectsUnshake = false
        if (effect) {
            for (let change of effect.data.changes) {
                if (change.key === "data.attributes.spirit.unShakeBonus") { affectsUnshake = true }
            }
        }
        // Remove from list if ae is present and affects the generic bonus:
        if (effect && affectsUnshake === true) {
            edgeAndAbilityNames.splice(index, 1)
        }
    }
    // Adding AE bonuses
    let effectName = [];
    let effectValue = [];
    for (let effect of actor.data.effects) {
        if (effect.data.disabled === false) { // only apply changes if effect is enabled
            for (let change of effect.data.changes) {
                if (change.key === "data.attributes.spirit.unShakeBonus") {
                    //Building array of effect names and icons that affect the unShakeBonus
                    effectName.push(effect.data.label);
                    effectValue.push(change.value);
                }
            }
        }
    }
    // Get generic modifier
    let genericMod = actor.data.data.attributes.spirit.unShakeBonus
    if (effectValue.length > 0 && genericMod !== 0) {
        for (let each of effectValue) {
            genericMod = genericMod - each
        }
    }
    // Checking if the actor has the Edges and Abilities:
    const edgesAndAbilities = actor.data.items.filter(function (item) {
        return edgeAndAbilityNames.includes(item.name.toLowerCase()) && (item.type === "edge" || item.type === "ability");
    })

    // Building the final array of modifiers to be passed:
    let modifiers = []
    for (let each of edgesAndAbilities) {
        modifiers.push({
            name: each.name,
            value: 2
        })}
    for (let i = 0; i < effectName.length; i++) {
        modifiers.push({
            name: effectName[i],
            value: parseFloat(effectValue[i])
        })}
    if (genericMod !== 0) {
        modifiers.push({
            name: "Generic Modifier",
            value: genericMod
        })
    }
    // Returning the modifiers array:
    return modifiers
}