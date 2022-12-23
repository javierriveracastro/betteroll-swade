// functions for the unshake and maybe un-stun card //
/* globals canvas, game, CONST, Hooks, succ, console */

import {get_owner} from "./damage_card.js";
import {
    BrCommonCard, BRSW_CONST, BRWSRoll, create_common_card, get_actor_from_message,
    roll_trait, spend_bennie, update_message
} from "./cards_common.js";
import {status_footer} from "./incapacitation_card.js";

/**
 * Shows the unshaken card
 * @param {ChatMessage} original_message
 * @param {SwadeActor} actor
 * @param {Number} type
 */
async function create_remove_status_card(original_message, actor, type) {
    let token_id;
    if (original_message) {
        const br_card = new BrCommonCard(original_message);
        actor = get_actor_from_message(original_message)
        token_id = br_card.token_id;
    } else if (actor) {
        token_id = actor.token ? actor.token.id : actor.getActiveTokens()[0].id
    }
    if (! actor.system.status.isShaken && !actor.system.status.isStunned) {return}
    let user = get_owner(actor);
    // noinspection JSUnresolvedVariable
    const text = (type === BRSW_CONST.TYPE_UNSHAKE_CARD) ?
        game.i18n.format("BRSW.UnshakenText", {token_name: actor.name}):
        game.i18n.format("BRSW.UnstunText", {token_name: actor.name})
    let footer = status_footer(actor)
    let trait_roll = new BRWSRoll();
    let title_name = type === BRSW_CONST.TYPE_UNSHAKE_CARD ? "BRSW.Unshake" : "BRSW.Unstun";
    const roll_title = type === BRSW_CONST.TYPE_UNSHAKE_CARD ?
        game.i18n.localize('BRSW.SpiritRoll') :
        game.i18n.localize('BRSW.VigorRoll');
    let message = await create_common_card(actor,
    {header: {type: '',
        title: game.i18n.localize(title_name),
        notes: actor.name}, roll_title: roll_title, text: text, footer: footer,
        trait_roll: trait_roll, show_roll_injury: false, attribute_name: 'spirit'}, CONST.CHAT_MESSAGE_TYPES.ROLL,
    "modules/betterrolls-swade2/templates/remove_status_card.html")
    await message.update({user: user.id});
    let br_message = new BrCommonCard(message)
    br_message.type = type
    br_message.token_id = token_id
    await br_message.save()
    return message
}

export async function create_unshaken_card(original_message, token_id) {
    await create_remove_status_card(original_message, token_id, BRSW_CONST.TYPE_UNSHAKE_CARD)
}

/**
 * Shows the unstun card
 * @param {ChatMessage} original_message
 * @param {Number} token_id
 */
export async function create_unstun_card(original_message, token_id) {
    await create_remove_status_card(original_message, token_id, BRSW_CONST.TYPE_UNSTUN_CARD)
}


/**
 * Activate the listeners of the unshake card
 * @param message: Message data
 * @param html: Html produced
 * @param card_type: Type of card
 */
export function activate_remove_status_card_listeners(message, html, card_type) {
    const roll_function = card_type === BRSW_CONST.TYPE_UNSHAKE_CARD ?
        roll_unshaken : roll_unstun
    html.find('.brsw-spirit-button, .brsw-roll-button').click((ev) =>{
        let spend_bennie = false
        if (ev.currentTarget.classList.contains('roll-bennie-button') ||
                ev.currentTarget.classList.contains('brsw-soak-button')) {
            spend_bennie=true
        }
        // noinspection JSIgnoredPromiseFromCall
        roll_function(message, spend_bennie);
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
        succ.apply_status(actor, 'shaken', false).catch(
            console.error("Error removing shaken") || false)
    } else {
        // Check for Edges & Abilities
        const modifiers = await check_abilities(actor)
        // Make the roll
        const roll = await roll_trait(message,
            actor.system.attributes.spirit, game.i18n.localize("BRSW.SpiritRoll"),
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
            succ.apply_status(actor, 'shaken', false).catch(console.error("Error removing shaken") || false)
        } else {
            render_data.text = game.i18n.format("BRSW.UnshakeFailure", {name: actor.name})
        }
    }
    await update_message(message, actor, render_data);
    Hooks.call("BRSW-Unshake", new BrCommonCard(message), actor)
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
        let effect = actor.effects.find(active_e => active_e.label.toLowerCase() === value) // jshint ignore:line
        // Only splice if the AE affects the generic bonus:
        let affectsUnshake = false
        if (effect) {
            for (let change of effect.changes) {
                if (change.key === "data.attributes.spirit.unShakeBonus" || change.key === "system.attributes.spirit.unShakeBonus") { affectsUnshake = true }
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
    for (let effect of actor.effects) {
        if (effect.disabled === false) { // only apply changes if effect is enabled
            for (let change of effect.changes) {
                if (change.key === "data.attributes.spirit.unShakeBonus" || change.key === "system.attributes.spirit.unShakeBonus") {
                    //Building array of effect names and icons that affect the unShakeBonus
                    effectName.push(effect.label);
                    effectValue.push(change.value);
                }
            }
        }
    }
    // Get generic modifier
    let genericMod = actor.system.attributes.spirit.unShakeBonus
    if (effectValue.length > 0 && genericMod !== 0) {
        for (let each of effectValue) {
            genericMod = genericMod - each
        }
    }
    // Checking if the actor has the Edges and Abilities:
    const edgesAndAbilities = actor.items.filter(function (item) {
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


/**
 * Roll to remove stunned
 * @param {ChatMessage} message
 */
async function roll_unstun(message) {
    const render_data = message.getFlag('betterrolls-swade2',
        'render_data');
    const actor = get_actor_from_message(message);
    const roll = await roll_trait(message,
    actor.system.attributes.vigor, game.i18n.localize("BRSW.VigorRoll"),
    '', {});
    let result = 0;
    roll.rolls.forEach(roll => {
        result = Math.max(roll.result, result);
    })
    if (result >= 4) {
        render_data.text = game.i18n.format("BRSW.UnstunSuccessfulRoll", {name: actor.name})
        succ.apply_status(actor, 'stunned', false).catch(console.error("Error removing stunned") || false)
    } else {
        render_data.text = game.i18n.format("BRSW.UnstunFailure", {name: actor.name})
    }
    await update_message(message, actor, render_data);
    Hooks.call("BRSW-Unstun", new BrCommonCard(message), actor)
}