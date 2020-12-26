import {BRSW_CONST, create_basic_chat_data, create_render_options,
    get_actor_from_message, spend_bennie} from "./cards_common.js";
import {make_item_footer} from "./item_card.js"
import {create_result_card} from "./result_card.js";

/**
* Creates a chat damage card for an item
*
* @param {Token, SwadeActor} origin  The actor or token owning the attribute
* @param {string} item_id The id of the item that we want to show
* @return A promise for the ChatMessage object
*/
export async function create_item_damage_card(origin, item_id) {
    const actor = origin.hasOwnProperty('actor')?origin.actor:origin;
    const item = actor.items.find(item => {return item.id === item_id});
    let chatData = create_basic_chat_data(actor, CONST.CHAT_MESSAGE_TYPES.IC);
    // Damage cards are always private
    chatData.whisper = [game.user._id];
    let footer = make_item_footer(item);
    const notes = item.data.data.notes || item.name;
    let render_object = create_render_options(
        actor, {actor: actor, header: {type: 'Damage', title: item.name,
            notes: notes, img: item.img}, footer: footer,
            description: item.data.data.description})
    chatData.content = await renderTemplate(
        "modules/betterrolls-swade2/templates/damage_card.html", render_object);
    let message = await ChatMessage.create(chatData);
    await message.setFlag('betterrolls-swade2', 'card_type',
        BRSW_CONST.TYPE_DMG_CARD)
    await message.setFlag('betterrolls-swade2', 'item_id',
        item_id)
    // We always set the actor (as a fallback, and the token if possible)
    await message.setFlag('betterrolls-swade2', 'actor',
            actor.id)
    if (actor !== origin) {
        // noinspection JSUnresolvedVariable
        await message.setFlag('betterrolls-swade2', 'token',
            origin.id)
    }
    return message;
}


/**
 * Hooks the public functions to a global object
 */
export function damage_card_hooks() {
    game.brsw.create_item_damage_card = create_item_damage_card;
}


/**
 * Activate the listeners in the damage card
 * @param message: Message
 * @param html: Html produced
 */
export function activate_damage_card_listeners(message, html) {
    html.find('.brsw-header-img').click(_ => {
        const actor = get_actor_from_message(message);
        const item = actor.getOwnedItem(message.getFlag(
            'betterrolls-swade2', 'item_id'));
        item.sheet.render(true);
    });
    html.find('.brsw-damage-button').click((ev) => {
        // noinspection JSIgnoredPromiseFromCall
        roll_dmg(message, html, false, {}, ev.currentTarget.id.includes('raise'));
    })
}


/**
 * Gets the tougness value for the targeted token
 */
function get_tougness_targeted() {
    const targets = game.user.targets;
    let objetive;
    let defense_values = {toughness: 4, armor: 0}
    if (targets.size) objetive = Array.from(targets)[0];
    if (objetive) {
        defense_values.toughness = parseInt(
              objetive.actor.data.data.stats.toughness.value);
        defense_values.armor = parseInt(
              objetive.actor.data.data.stats.toughness.armor);
    }
    return defense_values
}



/**
 * Rolls damage dor an item
 * @param message
 * @param html
 * @param expend_bennie
 * @param default_options
 * @param {boolean} raise
 * @return {Promise<void>}
 */
export async function roll_dmg(message, html, expend_bennie, default_options, raise){
    const actor = get_actor_from_message(message)
    const item_id = message.getFlag('betterrolls-swade2', 'item_id');
    const item = actor.items.find((item) => item.id === item_id);
    if (expend_bennie) spend_bennie(actor);
    let roll_mods = [];
    let total_modifiers = 0;
    let options = default_options;
    options.suppressChat = true;
    options.rof = 1; // Damage rolls are always rof 1
    if (! default_options.hasOwnProperty('additionalMods')) {
        // New roll, read html for mods
        options.additionalMods = []
        html.find('.brws-selectable.brws-selected').each((_, element) => {
            roll_mods.push({label: game.i18n.localize('BRSW.Card'),
                value: element.dataset.value});
            options.additionalMods.push(element.dataset.value);
        })
        // Dice tray modifier
        let tray_modifier = parseInt($("input.dice-tray__input").val());
        if (tray_modifier) {
            roll_mods.push({label: 'Dice tray', value: tray_modifier});
            options.additionalMods.push(tray_modifier);
        }
        // Get tougness and armor from selected token.
        const defense_values = get_tougness_targeted()
        options.tn = defense_values.toughness;
        options.target_armor = defense_values.armor;
    }
    let roll = item.rollDamage(options);
    let formula = roll.formula;
    if (raise) {
        formula += '+1d6x'
    }
    roll = new Roll(formula);
    // Customize flavour text
    let flavour =
        `${item.name} ${game.i18n.localize('BRSW.DamageTest')}<br>`;
    roll_mods.forEach(mod => {
        const positive = parseInt(mod.value) > 0?'brsw-positive':'';
        flavour += `<span class="brsw-modifier ${positive}">${mod.label}:&nbsp${mod.value} </span>`;
        total_modifiers = total_modifiers + parseInt(mod.value);
    })
    // Store if it is a raise roll and item ap
    options.raise = raise;
    options.ap = item.data.data.ap || 0;
    // Show roll card
    await roll.toMessage({speaker: ChatMessage.getSpeaker({ actor: actor }),
        flavor: flavour});
    // Show result card
    await create_result_card(actor, [roll.total], total_modifiers,
        message.id, options);
}
