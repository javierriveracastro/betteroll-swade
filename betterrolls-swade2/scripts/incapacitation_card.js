// functions for the incapacitation card
/* globals canvas, game, CONST, Roll, Hooks, succ */

import {
    BrCommonCard,
    BRSW_CONST,
    BRWSRoll,
    create_common_card,
    get_actor_from_message,
    roll_trait,
    spend_bennie, update_message
} from "./cards_common.js";
import {get_owner, damage_card_footer} from "./damage_card.js";

const INJURY_BASE = {
    2: "BRSW.Unmentionables",
    3: "BRSW.Arm",
    5: "BRSW.Guts",
    10: "BRSW.Leg",
    12: "BRSW.Head"
}

const SECOND_INJURY_TABLES = {
    "BRSW.Guts": {
        1: "BRSW.Broken",
        3: "BRSW.Battered",
        5: "BRSW.Busted"
    },
    "BRSW.Head" : {
        1: "BRSW.Scar",
        4: "BRSW.Blinded",
        6: "BRSW.Brain"
    }
}

const INJURY_ACTIVE_EFFECT = {
    "BRSW.Guts+BRSW.Broken": {changes: [{key: "data.attributes.agility.die.sides", mode: 2, value: -2}]},
    "BRSW.Guts+BRSW.Battered": {changes: [{key: "data.attributes.vigor.die.sides", mode: 2, value: -2}]},
    "BRSW.Guts+BRSW.Busted": {changes: [{key: "data.attributes.strength.die.sides", mode: 2, value: -2}]},
    "BRSW.Head+BRSW.Brain": {changes: [{key: "data.attributes.smarts.die.sides", mode: 2, value: -2}]},
    "BRSW.Leg+": {changes: [{key: "data.stats.speed.runningDie", mode: 2, value: -2},
            {key: "data.stats.speed.value", mode: 2, value: -2}]},
    "BRSW.Head+BRSW.Blinded" : {},
    "BRSW.Head+BRSW.Scar": {}
}

/**
 * Shows an incapacitation card an
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
    let footer = status_footer(actor)
    let trait_roll = new BRWSRoll();
    let br_message = await create_common_card(token,
    {header: {type: '',
        title: game.i18n.localize("BRSW.Incapacitation"),
        notes: token.name}, text: text, text_after: text_after,
        footer: footer, trait_roll: trait_roll, show_roll_injury: false, attribute_name: 'vigor'},
        CONST.CHAT_MESSAGE_TYPES.ROLL,
    "modules/betterrolls-swade2/templates/incapacitation_card.html")
    this.update_list={...this.update_list, ...{user: user.id}};
    br_message.type = BRSW_CONST.TYPE_INC_CARD
    await br_message.render()
    await br_message.save()
    return br_message.message
}

/**
 * Hooks the public functions to a global object
 */
export function incapacitation_card_hooks() {
    game.brsw.create_incapacitation_card = create_incapacitation_card
}

/**
 * Creates a footer based in status that will be shared by various cards
 */
export function status_footer(actor) {
    return damage_card_footer(actor)
}

/**
 * Checks if a benny has been expended and rolls in the incapacitation table.
 * @param ev
 */
function roll_incapacitation_clicked(ev) {
        let spend_bennie = false
        if (ev.currentTarget.classList.contains('roll-bennie-button')) {
            spend_bennie=true
        }
        // noinspection JSIgnoredPromiseFromCall
        roll_incapacitation(ev.data.message, spend_bennie);
}

/**
 * Activate the listeners of the incapacitation card
 * @param message: Message date
 * @param html: Html produced
 */
export function activate_incapacitation_card_listeners(message, html) {
    const br_card = new BrCommonCard(message);
    html.find('.brsw-vigor-button, .brsw-roll-button').bind(
        'click', {message: message}, roll_incapacitation_clicked);
    html.find('.brsw-injury-button').click(() => {
        // noinspection JSIgnoredPromiseFromCall
        create_injury_card(br_card.token_id)
    })
}



/**
 * Males a vigor incapacitation roll
 * @param {ChatMessage} message
 * @param {boolean} spend_benny
 */
async function roll_incapacitation(message, spend_benny) {
    const br_card = new BrCommonCard(message);
    const render_data = message.getFlag('betterrolls-swade2',
        'render_data');
    const actor = get_actor_from_message(message)
    if (spend_benny) {
        await spend_bennie(actor);
    }
    const roll = await roll_trait(message,
        actor.system.attributes.vigor, game.i18n.localize("BRSW.IncapacitationRoll"), '', {});
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
    render_data.show_roll_injury = true;
    if (roll.is_fumble) {
        render_data.text_after = `</p><p>${game.i18n.localize("BRSW.Fumble")}</p><p>${br_card.token.name} ${game.i18n.localize("BRSW.IsDead")}</p>`
        render_data.show_roll_injury = false;  // For what...
    } else if (result < 4) {
        render_data.text_after = game.i18n.localize("BRSW.BleedingOutResult")
        succ.apply_status(br_card.token_id, "bleeding-out")
    } else if (result < 8) {
        render_data.text_after = game.i18n.localize("BRSW.TempInjury")
    } else {
        render_data.text_after = game.i18n.localize("BRSW.TempInjury24")
    }
    await update_message(message, actor, render_data);
}


/**
 * Shows an injury card and rolls it.
 * @param token_id
 */
export async function create_injury_card(token_id) {
    let token = canvas.tokens.get(token_id);
    let actor = token.actor;
    let user = get_owner(actor);
    // noinspection JSUnresolvedVariable
    let footer = [`${game.i18n.localize("SWADE.Wounds")}: ${actor.system.wounds.value}/${actor.system.wounds.max}`]
    for (let status in actor.system.status) {
        // noinspection JSUnfilteredForInLoop
        if (actor.system.status[status]) {
            // noinspection JSUnfilteredForInLoop
            footer.push(status.slice(2));
        }
    }
    // First roll
    let first_roll = new Roll("2d6");
    first_roll.evaluate({async:false});
    if (game.dice3d) {
        // noinspection ES6MissingAwait
        await game.dice3d.showForRoll(first_roll, game.user, true);
    }
    const first_result = read_table(INJURY_BASE, parseInt(first_roll.result));
    let second_result = ''
    // Check for another roll
    let second_roll = new Roll("1d6");
    for (let table in SECOND_INJURY_TABLES) {
        if (SECOND_INJURY_TABLES.hasOwnProperty(table)) {
            if (first_result === table) {
                second_roll.evaluate({async:false});
                if (game.dice3d) {
                    // noinspection ES6MissingAwait
                    await game.dice3d.showForRoll(second_roll, game.user, true);
                }
                second_result = read_table(SECOND_INJURY_TABLES[table],
                    parseInt(second_roll.result));
            }
        }
    }
    const active_effect_index = `${first_result}+${second_result}`;
    let new_effect
    let injury_effect
    if (INJURY_ACTIVE_EFFECT.hasOwnProperty(active_effect_index)) {
        new_effect = { ...INJURY_ACTIVE_EFFECT[active_effect_index]};
        if (second_result) {
            new_effect.label = game.i18n.localize(second_result);
        } else {
            new_effect.label = game.i18n.localize(first_result);
        }
        new_effect.icon = '/systems/swade/assets/icons/skills/medical-pack.svg';
        injury_effect = await actor.createEmbeddedDocuments('ActiveEffect', [new_effect]);
    }
    let br_message = await create_common_card(token,
    {header: {type: '',
        title: game.i18n.localize("BRSW.InjuryCard"),
        notes: token.name}, first_roll: first_roll, second_roll: second_roll,
        first_location: game.i18n.localize(first_result),
        second_location: game.i18n.localize(second_result),
        footer: footer}, CONST.CHAT_MESSAGE_TYPES.ROLL,
    "modules/betterrolls-swade2/templates/injury_card.html")
    this.update_list={...this.update_list, ...{user: user.id}};
    br_message.type = BRSW_CONST.TYPE_INJ_CARD
    await br_message.save()
    await br_message.render()
    Hooks.call('BRSW-InjuryAEApplied', br_message, injury_effect)
    return br_message.message
}

/**
 * Reads the result on a table
 * @param {object} table
 * @param {Number} value
 */
function read_table(table, value) {
    let result;
    for (let index in table) {
        if (table.hasOwnProperty(index)) {
            if (parseInt(index) <= value) {
                result = table[index];
            }
        }
    }
    return result;
}