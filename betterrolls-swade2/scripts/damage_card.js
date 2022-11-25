// Functions for the damage card
/* global game, canvas, CONST, Token, CONFIG, Hooks, succ */
import {
    BRSW_CONST, BRWSRoll, create_common_card, get_actor_from_message, are_bennies_available,
    roll_trait, spend_bennie, update_message, BrCommonCard
} from "./cards_common.js";
import {create_incapacitation_card, create_injury_card} from "./incapacitation_card.js";

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
    let undo_values = {wounds: actor.system.wounds.value,
        shaken: actor.system.status.isShaken};
    let wounds = Math.floor(damage / 4)
    if (game.settings.get('betterrolls-swade2', 'wound-cap')) {
       wounds = Math.min(wounds, game.settings.get('betterrolls-swade2', 'wound-cap'))
    }
    // noinspection JSUnresolvedVariable
    const can_soak = wounds || actor.system.status.isShaken;
    const damage_result = await apply_damage(token, wounds, 0);
    const footer = damage_card_footer(actor);
    const show_injury = (game.settings.get(
        'betterrolls-swade2', 'optional_rules_enabled').indexOf(
            "GrittyDamage") > -1) && can_soak && (actor.system.wounds.max > 1);
    let trait_roll = new BRWSRoll();
    let message = await create_common_card(token,
    {header: {type: game.i18n.localize("SWADE.Dmg"),
        title: game.i18n.localize("SWADE.Dmg"),
        notes: damage_text}, text: damage_result.text, footer: footer,
        undo_values: undo_values, trait_roll: trait_roll, wounds: wounds,
        soaked: 0, soak_possible: (are_bennies_available(actor) && can_soak),
        show_incapacitation: damage_result.incapacitated && actor.isWildcard,
        show_injury: show_injury, attribute_name: 'vigor'},
        CONST.CHAT_MESSAGE_TYPES.ROLL,
    "modules/betterrolls-swade2/templates/damage_card.html")
    await message.update({user: user.id});
    let br_message = new BrCommonCard(message);
    br_message.type = BRSW_CONST.TYPE_DMG_CARD;
    await br_message.save();
    Hooks.call("BRSW-AfterShowDamageCard", actor, wounds, message);
    return message
}


/**
 * Creates the footer for damage and incapacitation cards
 * @param {{SwadeActor}} actor
 * @return {[string]}
 */
export function damage_card_footer(actor){
    // noinspection JSUnresolvedVariable
    let footer = [`${game.i18n.localize("SWADE.Wounds")}: ${actor.system.wounds.value}/${actor.system.wounds.max}`]
    // noinspection JSUnresolvedVariable
    for (let status in actor.system.status) {
        // noinspection JSUnfilteredForInLoop,JSUnresolvedVariable
        if (actor.system.status[status]) {
            // noinspection JSUnfilteredForInLoop
            footer.push(status.slice(2));
        }
    }
    return footer
}


/**
 * Gets the owner of an actor
 * @param {SwadeActor} actor
 */
export function get_owner(actor) {
    let owner;
    let player;
    let gm;
    game.users.forEach(user => {
        if (user.isGM) {
            gm = user
        } else {
            if (user.character?.id === actor.id) {
                owner = user
            } else if (actor.getUserLevel(user) > 2) {
                player = user
            }
        }
    })
    return owner || player || gm;
}


/**
 * Applies damage to a token
 * @param token
 * @param {int} wounds
 * @param {int} soaked
 */
async function apply_damage(token, wounds, soaked=0) {
    if (wounds < 0) {return}
    let incapacitated;
    if (!(token instanceof Token)) {
        // If this is not a token then it is a token id
        token = canvas.tokens.get(token);
    }
    // We take the starting situation
    let initial_wounds = token.actor.system.wounds.value;
    // noinspection JSUnresolvedVariable
    let initial_shaken = token.actor.system.status.isShaken;
    // We test for double shaken
    let damage_wounds = wounds;
    let final_shaken = true; // Any damage also shakes the token
    let text = ''
    if (wounds < 1 && initial_shaken) {
        // Shaken twice
        if (token.actor.items.find(item => {
            return item.name.toLowerCase().includes(
                game.i18n.localize("BRSW.HardyIdentifier")) &&
                (item.type === "edge" || item.type === 'ability');
            })) {
            text += game.i18n.localize("BRSW.HardyActivated");
            damage_wounds = 0
        } else {
            damage_wounds = 1;
        }
    }
    text += wounds ? game.i18n.format(
        "BRSW.TokenWounded", {token_name:token.name, wounds: wounds}) :
        (damage_wounds ? game.i18n.format("BRSW.DoubleShaken",
            {token_name: token.name}) :
            game.i18n.format("BRSW.TokenShaken", {token_name:token.name}));
    // Now we look for soaking
    if (soaked) {
        damage_wounds = damage_wounds - soaked;
        if (damage_wounds <= 0) {
            // All damage soaked, remove shaken
            damage_wounds = 0;
            final_shaken = false;
            text += game.i18n.localize("BRSW.AllSoaked");
        } else {
            text += game.i18n.format("BRSW.SomeSoaked", {soaked: soaked});
        }
    }
    // Final damage
    let final_wounds = initial_wounds + damage_wounds;
    incapacitated = final_wounds > token.actor.system.wounds.max
    await succ.apply_status(token, 'incapacitated', incapacitated, true)
    // We cap damage on actor number of wounds
    final_wounds = Math.min(final_wounds, token.actor.system.wounds.max)
    // Finally, we update actor and mark defeated
    await token.actor.update({'data.wounds.value': final_wounds})
    await succ.apply_status(token, 'shaken', final_shaken)
    Hooks.call("BRSW-AfterApplyDamage", token, final_wounds, final_shaken,
        incapacitated, initial_wounds, initial_shaken, soaked);
    return {text: text, incapacitated: incapacitated};
}


/**
 * Undo the damage in one card
 * @param {ChatMessage} message
 */
async function undo_damage(message){
    const br_card = new BrCommonCard(message);
    const actor = get_actor_from_message(message);
    const render_data = message.getFlag('betterrolls-swade2',
        'render_data');
    await actor.update({"data.wounds.value": render_data.undo_values.wounds})
    if (br_card.token) {
        // Remove incapacitation and shaken
        let token_object = br_card.token.document
        await succ.apply_status(token_object, 'shaken', render_data.undo_values.shaken)
        let inc_effects = token_object.actor.effects.filter(
                e => e.flags?.core?.statusId === 'incapacitated').map(
                    effect => {return effect.id})
        await token_object.actor.deleteEmbeddedDocuments('ActiveEffect', inc_effects)
    }
    await message.delete();
}


/**
 * Activate the listeners of the damage card
 * @param message: Message date
 * @param html: Html produced
 */
export function activate_damage_card_listeners(message, html) {
    const br_card = new BrCommonCard(message);
    html.find('.brsw-undo-damage').click(async () =>{
        await undo_damage(message);
    });
    html.find('.brsw-soak-button, .brsw-roll-button').click((ev) =>{
        let spend_bennie = false
        if (ev.currentTarget.classList.contains('roll-bennie-button') ||
                ev.currentTarget.classList.contains('brsw-soak-button')) {
            spend_bennie=true
        }
        // noinspection JSIgnoredPromiseFromCall
        roll_soak(message, spend_bennie);
    });
    html.find('.brsw-show-incapacitation').click(() => {
        // noinspection JSIgnoredPromiseFromCall
        create_incapacitation_card(br_card.token_id)
    });
    html.find('.brsw-injury-button').click(() => {
        // noinspection JSIgnoredPromiseFromCall
        create_injury_card(br_card.token_id)
    })
}

/**
 * Males a soak roll
 * @param {ChatMessage} message
 * @param {Boolean} use_bennie
 */
async function roll_soak(message, use_bennie) {
    const render_data = message.getFlag('betterrolls-swade2',
        'render_data');
    const actor = get_actor_from_message(message);
    if (use_bennie) {
        await spend_bennie(actor);
    }
    let undo_wound_modifier = Math.min(actor.system.wounds.value, 3) -
        render_data.undo_values.wounds;
    const ignored_wounds = parseInt(actor.system.wounds.ignored);
    if (ignored_wounds) {
        undo_wound_modifier = Math.max(0, undo_wound_modifier -ignored_wounds)
    }
    let soak_modifiers = [{name: game.i18n.localize("BRSW.RemoveWounds"),
        value: undo_wound_modifier}]
    if (actor.items.find(item => {
        return item.type === 'edge' && item.name.toLowerCase().includes(
                game.i18n.localize("BRSW.EdgeName-IronJaw").toLowerCase())})) {
        soak_modifiers.push({name: game.i18n.localize("BRSW.EdgeName-IronJaw"),
            value: 2})
    }
    // Active effects
    let soak_active_effects = actor.effects.filter(
        e => e.changes.find(ch => ch.key === 'brsw.soak-modifier'))
    for (let effect of soak_active_effects) {
        let modifier = effect.changes.find(ch => ch.key ===
            'brsw.soak-modifier').value
        soak_modifiers.push({name: effect.label, value: parseInt(modifier)})
    }
    const roll = await roll_trait(message,
        actor.system.attributes.vigor, game.i18n.localize("BRSW.SoakRoll"),
        '', {modifiers: soak_modifiers});
    let result = 0;
    roll.rolls.forEach(roll => {
        result = Math.max(roll.result, result);
    })
    roll.old_rolls.forEach(old_roll => {
        old_roll.forEach(roll => {
            result = Math.max(roll.result, result);
        })
    })
    if (result >= 4) {
        render_data.soaked = Math.floor(result / 4);
        await actor.update({"data.wounds.value": render_data.undo_values.wounds})
        const damage_result = await apply_damage(message.getFlag(
            'betterrolls-swade2', 'token'), render_data.wounds,
            render_data.soaked);
        render_data.text = damage_result.text
        render_data.show_incapacitation = damage_result.incapacitated &&
            actor.isWildcard;
        render_data.show_injury = (game.settings.get(
        'betterrolls-swade2', 'optional_rules_enabled').indexOf(
            "GrittyDamage") > -1) && (render_data.wounds > render_data.soaked)
        await update_message(message, actor, render_data);
    }
}
