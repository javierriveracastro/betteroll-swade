// Functions for cards representing all items but skills

import {
    BRSW_CONST, create_basic_chat_data, create_render_options,
    get_action_from_click, get_actor_from_message
} from "./cards_common.js";

/**
* Creates a chat card for an item
*
* @param {Token, SwadeActor} origin  The actor or token owning the attribute
* @param {string} item_id The id of the item that we want to show
* @return A promise for the ChatMessage object
*/
async function create_item_card(origin, item_id) {
    const actor = origin.hasOwnProperty('actor')?origin.actor:origin;
    const item = actor.items.find(item => {return item.id === item_id});
    let chatData = create_basic_chat_data(actor, CONST.CHAT_MESSAGE_TYPES.IC);
    let footer = make_item_footer(item);
    let render_object = create_render_options(
        actor, {actor: actor, header: {type: 'Item', title: item.name,
            notes: item.data.data.notes, img: item.img}, footer: footer,
            description: item.data.data.description})
    chatData.content = await renderTemplate(
        "modules/betterrolls-swade/templates/item_card.html", render_object);
    let message = await ChatMessage.create(chatData);
    await message.setFlag('betterrolls-swade', 'card_type',
        BRSW_CONST.TYPE_ITEM_CARD)
    await message.setFlag('betterrolls-swade', 'item_id',
        item_id)
    // We always set the actor (as a fallback, and the token if possible)
    await message.setFlag('betterrolls-swade', 'actor',
            actor.id)
    if (actor !== origin) {
        // noinspection JSUnresolvedVariable
        await message.setFlag('betterrolls-swade', 'token',
            origin.id)
    }
    return message;
}

/**
 * Hooks the public functions to a global object
 */
export function item_card_hooks() {
    game.brsw.create_item_card = create_item_card;
}


/**
 * Listens to click events on character sheets
 * @param ev: javascript click event
 * @param {SwadeActor, Token} target: token or actor from the char sheet
 */
async function item_click_listener(ev, target) {
    const action = get_action_from_click(ev);
    if (action === 'system') return;
    ev.stopImmediatePropagation();
    ev.preventDefault();
    ev.stopPropagation();
    // First term for PC, second one for NPCs
    const item_id = ev.currentTarget.parentElement.parentElement.dataset.itemId ||
        ev.currentTarget.parentElement.dataset.itemId
    // Show card
    await create_item_card(
        target, item_id);
    if (action.includes('trait')) {
        console.log("Item roll")
    }
}


/**
 * Activates the listeners in the character sheet in items
 * @param app: Sheet app
 * @param html: Html code
 */
export function activate_item_listeners(app, html) {
    let target = app.token?app.token:app.object;
    const item_images = html.find('.item-image, .item-img, .item.flexrow > img');
    item_images.bindFirst('click', async ev => {
        await item_click_listener(ev, target);
    });
}


/**
 * Activate the listeners in the item card
 * @param message: Message date
 * @param html: Html produced
 */
export function activate_item_card_listeners(message, html) {
    html.find('.brsw-header-img').click(_ => {
        const actor = get_actor_from_message(message);
        const item = actor.getOwnedItem(message.getFlag(
            'betterrolls-swade', 'item_id'));
        item.sheet.render(true);
    })
}


/**
 * Creates a footer useful for an item.
 */
function make_item_footer(item) {
    let footer = [];
    if (item.type === "weapon"){
        footer.push("Range: " +  item.data.data.range);
        // noinspection JSUnresolvedVariable
        footer.push("Rof: "+ item.data.data.rof);
        // noinspection JSUnresolvedVariable
        footer.push("Dmg: " + item.data.data.damage);
        footer.push("AP: " + item.data.data.ap);
        if (parseInt(item.data.data.shots)) {
            // noinspection JSUnresolvedVariable
            footer.push("Shots: " + item.data.data.currentShots + "/" +
                this.item.data.data.shots)
        }
    } else if (item.type === "power"){
        // noinspection JSUnresolvedVariable
        footer.push("PP: " + item.data.data.pp);
        footer.push("Range: " + item.data.data.range);
        footer.push("Duration: " + item.data.data.duration);
        // noinspection JSUnresolvedVariable
        if (item.data.data.damage) {
            // noinspection JSUnresolvedVariable
            footer.push("Damage: " + item.data.data.damage);
        }
    } else if (item.type === "armor") {
        footer.push("Armor: " + item.data.data.armor);
        // noinspection JSUnresolvedVariable
        footer.push("Min. Strength: " + item.data.data.minStr);
        let locations = "Location: "
        for (let armor_location in item.data.data.locations) {
            if (item.data.data.locations.hasOwnProperty(armor_location) &&
                    item.data.data.locations[armor_location]) {
                locations += armor_location;
            }
        }
        footer.push(locations)
    } else if (item.type === "shield") {
        footer.push("Parry: " + item.data.data.parry);
        // noinspection JSUnresolvedVariable
        footer.push("Cover: " + item.data.data.cover);
    }
    console.log(item)
    return footer
}