// Functions for cards representing attributes

import {create_basic_chat_data, BRSW_CONST, get_action_from_click,
    get_actor_from_message, get_roll_options, detect_fumble,
    create_render_options, spend_bennie, get_actor_from_ids} from "./cards_common.js";
import {create_result_card, show_fumble_card} from './result_card.js'

/**
* Creates a card for an attribute
* @param {token, actor} origin  The actor or token owning the attribute
* @param {string} name The name of the attribute
* @return A promise for the ChatMessage object
*/
async function create_attribute_card(origin, name){
    let actor = origin.hasOwnProperty('actor')?origin.actor:origin;
    let chatData = create_basic_chat_data(actor, CONST.CHAT_MESSAGE_TYPES.IC);
    let notes = name + " " + attribute_to_string(
        actor.data.data.attributes[name.toLowerCase()]);
    let footer = [];
    for (let attribute in actor.data.data.attributes) {
        if (actor.data.data.attributes.hasOwnProperty(attribute)) {
            footer.push(`${attribute} ${attribute_to_string(
                actor.data.data.attributes[attribute])}`)
        }
    }
    let render_object = create_render_options(
        actor, {actor: actor, header: {type: 'Attribute', title: name,
            notes: notes}, footer: footer})
    chatData.content = await renderTemplate(
        "modules/betterrolls-swade/templates/attribute_card.html", render_object);
    let message = await ChatMessage.create(chatData);
    await message.setFlag('betterrolls-swade', 'card_type',
        BRSW_CONST.TYPE_ATTRIBUTE_CARD)
    await message.setFlag('betterrolls-swade', 'attribute_id', name);
    // We always set the actor (as a fallback, and the token if possible)
        await message.setFlag('betterrolls-swade', 'actor',
            actor.id)
    if (actor !== origin) {
        // noinspection JSUnresolvedVariable
        await message.setFlag('betterrolls-swade', 'token',
            origin.id)
    }
    return message
}


/**
 * Creates an attribute card from a token or actor id, for use in macros
 * @param {string} token_id:
 * @param {string} actor_id
 * @param {string} name: Name of the attribute to roll
 */
function create_attribute_card_from_id(token_id, actor_id, name){
    const actor = get_actor_from_ids(token_id, actor_id);
    return create_attribute_card(actor, name);
}


/**
 * Function to convert attribute dice and modifiers into a string
 * @param attribute
 */
function attribute_to_string(attribute) {
    let string = `${name} d${attribute.die.sides}`;
    let modifier = parseInt(
        attribute.die.modifier);
    if (modifier) {
        string = string + (modifier > 0?"+":"") + modifier;
    }
    return string;
}

/**
 * Hooks the public functions to a global object
 */
export function attribute_card_hooks() {
    game.brsw.create_atribute_card = create_attribute_card;
    game.brsw.create_attribute_card_from_id = create_attribute_card_from_id;
}


/**
 * Creates a card after an event.
 * @param ev: javascript click event
 * @param {actor, token} target: token or actor from the char sheet
 */
async function attribute_click_listener(ev, target) {
    const action = get_action_from_click(ev);
    if (action === 'system') return;
    ev.stopImmediatePropagation();
    ev.preventDefault();
    ev.stopPropagation();
    // Show card
    await create_attribute_card(
      target, ev.currentTarget.parentElement.parentElement.dataset.attribute);
    if (action.includes('trait')) {
        await roll_attribute(
            target, ev.currentTarget.parentElement.parentElement.dataset.attribute, '', false)
    }
}

/**
 * Activates the listeners in the character sheet for attribute cards
 * @param app: Sheet app
 * @param html: Html code
 */
export function activate_attribute_listeners(app, html) {
    let target = app.token?app.token:app.object;
    // We need a closure to hold data
    const attribute_labels = html.find('.attribute-label a');
    attribute_labels.bindFirst('click', async ev => {
        await attribute_click_listener(ev, target);
    });
    attribute_labels.attr('draggable', 'true');
    attribute_labels.on('dragstart',async ev => {
        const macro_data = {name: "Attribute roll", type: "script", scope: "global"}
        const token_id = app.token ? app.token.id : '';
        const actor_id = app.object ? app.object.id : '';
        const attribute_name = ev.currentTarget.parentElement.parentElement.dataset.attribute
        macro_data.command = `game.brsw.create_attribute_card_from_id('${token_id}', '${actor_id}', '${attribute_name}')`;
        ev.originalEvent.dataTransfer.setData(
            'text/plain', JSON.stringify({type:'Macro', data: macro_data}));
    });
}


/**
 * Activate the listeners of the attribute card
 * @param message: Message date
 * @param html: Html produced
 */
export function activate_attribute_card_listeners(message, html) {
    html.find('#roll-button, #roll-bennie-button').click(async ev =>{
        let actor = get_actor_from_message(message);
        let attribute = message.getFlag('betterrolls-swade', 'attribute_id',);
        await roll_attribute(actor, attribute, html, ev.currentTarget.id.includes('bennie'));
    })
}


/**
 * Roll an attribute showing the roll card
 * @param {SwadeActor, token} character
 * @param {string} attribute_id
 * @param {string} html, the html of the attribute card
 * @param {boolean} expend_bennie: True if we want to spend a bennie
 */
async function roll_attribute(character, attribute_id, html, expend_bennie){
    // If character is a token get true actor
    // noinspection JSUnresolvedVariable
    let actor = character.actor?character.actor:character;
    if (expend_bennie) spend_bennie(actor);
    let options = get_roll_options(html);
    let total_modifiers = 0;
    options.suppressChat = true;
    let roll_mods = actor._buildTraitRollModifiers(
        actor.data.data.attributes[attribute_id], options);
    let roll = actor.rollAttribute(attribute_id, options);
    // Customize flavour text
    let flavour =
        `${game.i18n.localize(CONFIG.SWADE.attributes[attribute_id].long)} ${game.i18n.localize('SWADE.AttributeTest')}<br>`;
    roll_mods.forEach(mod => {
        const positive = parseInt(mod.value) > 0?'brsw-positive':'';
        flavour += `<span class="brsw-modifier ${positive}">${mod.label}:&nbsp${mod.value} </span>`;
        total_modifiers = total_modifiers + parseInt(mod.value);
    })
    // If actor is a wild card customize Wild dice color.
    if (actor.isWildcard && game.dice3d) {
        roll.dice[roll.dice.length - 1].options.colorset = game.settings.get(
            'betterrolls-swade', 'wildDieTheme');
    }
    // Show roll card
    await roll.toMessage({speaker: ChatMessage.getSpeaker({ actor: actor }),
        flavor: flavour});
    // Detect fumbles and show result card
    let is_fumble = await detect_fumble(roll)
    if (is_fumble) {
        await show_fumble_card(actor);
    } else {
        await create_result_card(actor, roll.results, total_modifiers, options.tn);
    }
}
