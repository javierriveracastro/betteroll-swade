// Functions for cards representing attributes

import {BRSW_CONST, get_action_from_click, get_actor_from_message,
    spend_bennie, get_actor_from_ids, trait_to_string, create_common_card,
    BRWSRoll, roll_trait} from "./cards_common.js";

/**
* Creates a chat card for an attribute
*
* @param {Token, SwadeActor} origin  The actor or token owning the attribute
* @param {string} name The name of the attribute like 'vigor'
* @return A promise for the ChatMessage object
*/
async function create_attribute_card(origin, name){
    let actor = origin.hasOwnProperty('actor')?origin.actor:origin;
    let title = name + " " + trait_to_string(
        actor.data.data.attributes[name.toLowerCase()]);
    let footer = [];
    for (let attribute in actor.data.data.attributes) {
        if (actor.data.data.attributes.hasOwnProperty(attribute)) {
            footer.push(`${attribute} ${trait_to_string(
                actor.data.data.attributes[attribute])}`)
        }
    }
    let trait_roll = new BRWSRoll();
    let message = await create_common_card(origin,
        {header: {type: game.i18n.localize("BRSW.Attribute"),
                title: title}, footer: footer,
            trait_roll: trait_roll}, CONST.CHAT_MESSAGE_TYPES.ROLL,
        "modules/betterrolls-swade2/templates/attribute_card.html")
    await message.setFlag('betterrolls-swade2', 'attribute_id', name);
    // We always set the actor (as a fallback, and the token if possible)
    await message.setFlag('betterrolls-swade2', 'card_type',
        BRSW_CONST.TYPE_ATTRIBUTE_CARD)
    return message
}


/**
 * Creates an attribute card from a token or actor id
 *
 * @param {string} token_id A token id, if it can be solved it will be used
 *  before actor
 * @param {string} actor_id An actor id, it could be set as fallback or
 *  if you keep token empty as the only way to find the actor
 * @param {string} name: Name of the attribute to roll, like 'vigor'
 * @return {Promise} a promise fot the ChatMessage object
 */
function create_attribute_card_from_id(token_id, actor_id, name){
    const actor = get_actor_from_ids(token_id, actor_id);
    return create_attribute_card(actor, name);
}


/**
 * Hooks the public functions to a global object
 */
export function attribute_card_hooks() {
    game.brsw.create_atribute_card = create_attribute_card;
    game.brsw.create_attribute_card_from_id = create_attribute_card_from_id;
    game.brsw.roll_attribute = roll_attribute;
}


/**
 * Creates a card after an event.
 * @param ev: javascript click event
 * @param {SwadeActor, Token} target: token or actor from the char sheet
 */
async function attribute_click_listener(ev, target) {
    const action = get_action_from_click(ev);
    if (action === 'system') return;
    ev.stopImmediatePropagation();
    ev.preventDefault();
    ev.stopPropagation();
    // The attribute id placement is sheet dependent.
    const attribute_id = ev.currentTarget.parentElement.parentElement.dataset.attribute ||
        ev.currentTarget.parentElement.dataset.attribute
    // Show card
    const message = await create_attribute_card(target, attribute_id);
    if (action.includes('trait')) {
        await roll_attribute(message, '', false)
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
    const attribute_labels = html.find('.attribute-label a, button.attribute-label');
    attribute_labels.bindFirst('click', async ev => {
        await attribute_click_listener(ev, target);
    });
    attribute_labels.attr('draggable', 'true');
    attribute_labels.on('dragstart',async ev => {
        const token_id = app.token ? app.token.id : '';
        const actor_id = app.object ? app.object.id : '';
        const attribute_name = ev.currentTarget.parentElement.parentElement.dataset.attribute ||
            ev.currentTarget.parentElement.dataset.attribute
        let macro_data = {name: attribute_name, type: "script", scope: "global"}
        macro_data.command = `game.brsw.create_attribute_card_from_id('${token_id}', '${actor_id}', '${attribute_name}').then(
            message => {game.brsw.roll_attribute(message, "")})`;
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
    html.find('.brsw-roll-button').click(async ev =>{
        await roll_attribute(message, html, ev.currentTarget.classList.contains(
            'roll-bennie-button'));
    })
}


/**
 * Roll an attribute showing the roll card and the result card when enables
 *
 * @param {ChatMessage} message
 * @param {string} html Current HTML code of the message
 * @param {boolean} expend_bennie, True if we want to spend a bennie
 */
export async function roll_attribute(message, html,
                                     expend_bennie){
    let actor = get_actor_from_message(message);
    const attribute_id = message.getFlag('betterrolls-swade2', 'attribute_id');
    if (expend_bennie) await spend_bennie(actor);
    await roll_trait(message, actor.data.data.attributes[attribute_id], game.i18n.localize(
        "BRSW.AbilityDie"), html, {});
}
