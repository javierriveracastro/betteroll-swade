// Functions for cards representing skills

import {
    BRSW_CONST, create_basic_chat_data, create_render_options, detect_fumble,
    get_action_from_click, get_actor_from_ids, get_actor_from_message, get_roll_options, spend_bennie, trait_to_string
} from "./cards_common.js";
import {create_result_card, show_fumble_card} from "./result_card.js";

/**
* Creates a chat card for a skill
*
* @param {Token, SwadeActor} origin  The actor or token owning the attribute
* @param {string} skill_id The id of the skill that we want to show
* @return A promise for the ChatMessage object
*/
async function create_skill_card(origin, skill_id) {
    const actor = origin.hasOwnProperty('actor')?origin.actor:origin;
    const skill = actor.items.find(item => {return item.id === skill_id});
    const notes = skill.name + ' ' + trait_to_string(skill.data.data)
    const footer = [game.i18n.localize('BRSW.Attribute') + ": " + skill.data.data.attribute]
    let chatData = create_basic_chat_data(actor, CONST.CHAT_MESSAGE_TYPES.IC);
    let render_object = create_render_options(
        actor, {actor: actor, header: {type: 'Skill', title: skill.name,
            notes: notes, img: skill.img}, footer: footer, show_rof: true,
            description: skill.data.data.description})
    chatData.content = await renderTemplate(
        "modules/betterrolls-swade/templates/skill_card.html", render_object);
    let message = await ChatMessage.create(chatData);
    await message.setFlag('betterrolls-swade', 'card_type',
        BRSW_CONST.TYPE_SKILL_CARD)
    await message.setFlag('betterrolls-swade', 'skill_id',
        skill_id)
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
* Creates an skill card from a token or actor id, mainly for use in macros
*
* @param {string} token_id A token id, if it can be solved it will be used
*  before actor
* @param {string} actor_id An actor id, it could be set as fallback or
*  if you keep token empty as the only way to find the actor
* @param {string} skill_id: Id of the skill item
* @return {Promise} a promise fot the ChatMessage object
*/
function create_skill_card_from_id(token_id, actor_id, skill_id){
    const actor = get_actor_from_ids(token_id, actor_id);
    return create_skill_card(actor, skill_id);
}


/**
 * Hooks the public functions to a global object
 */
export function skill_card_hooks() {
    game.brsw.create_skill_card = create_skill_card;
    game.brsw.create_skill_card_from_id = create_skill_card_from_id;
    game.brsw.roll_skill = roll_skill;
}


/**
 * Creates a card after an event.
 * @param ev: javascript click event
 * @param {SwadeActor, Token} target: token or actor from the char sheet
 */
async function skill_click_listener(ev, target) {
    const action = get_action_from_click(ev);
    if (action === 'system') return;
    ev.stopImmediatePropagation();
    ev.preventDefault();
    ev.stopPropagation();
    // First term for PC, second one for NPCs
    const skill_id = ev.currentTarget.parentElement.parentElement.dataset.itemId ||
        ev.currentTarget.parentElement.dataset.itemId
    // Show card
    await create_skill_card(
        target, skill_id);
    if (action.includes('trait')) {
        await roll_skill(
            target, skill_id, '', false)
    }
}


/**
 * Activates the listeners in the character sheet for skills
 * @param app: Sheet app
 * @param html: Html code
 */
export function activate_skill_listeners(app, html) {
    let target = app.token?app.token:app.object;
    const skill_labels = html.find('.skill-label a, .skill.item>a, .skill-name');
    skill_labels.bindFirst('click', async ev => {
        await skill_click_listener(ev, target);
    });
    // System drag listeners are on lis or spans, not as
    let skill_li = html.find('li.item.skill, span.item.skill');
    skill_li.bindFirst('dragstart',async ev => {
        // First term for PC, second one for NPCs
        const skill_id = ev.currentTarget.dataset.itemId;
        const macro_data = {name: "Skill roll", type: "script", scope: "global"};
        const token_id = app.token ? app.token.id : '';
        const actor_id = app.object ? app.object.id : '';
        macro_data.command = `game.brsw.create_skill_card_from_id('${token_id}', '${actor_id}', '${skill_id}')`;
        ev.originalEvent.dataTransfer.setData(
            'text/plain', JSON.stringify({type:'Macro', data: macro_data}));
    });

}


/**
 * Activate the listeners in the skill card
 * @param message: Message date
 * @param html: Html produced
 */
export function activate_skill_card_listeners(message, html) {
    html.find('#roll-button, #roll-bennie-button').click(async ev =>{
        const actor = get_actor_from_message(message);
        const skill_id = message.getFlag('betterrolls-swade', 'skill_id');
        await roll_skill(actor, skill_id, html, ev.currentTarget.id.includes('bennie'));
    });
    html.find('.brsw-header-img').click(_ => {
        const actor = get_actor_from_message(message);
        const item = actor.getOwnedItem(message.getFlag(
            'betterrolls-swade', 'skill_id'));
        item.sheet.render(true);
    })
}


/**
 * Roll a skill showing the roll card and the result card when enables
 *
 * @param {SwadeActor, token} character, The instance who is rolling
 * @param {string} skill_id the id of the skill we are going to roll
 * @param {string} html, The html code from a card that will be parsed for options,
 *      it could be an empty string.
 * @param {boolean} expend_bennie, True if we want to spend a bennie
 */
async function roll_skill(character, skill_id, html, expend_bennie){
    // If character is a token get true actor
    // noinspection JSUnresolvedVariable
    const actor = character.actor?character.actor:character;
    const skill = actor.items.find((item) => item.id === skill_id);
    if (expend_bennie) spend_bennie(actor);
    let options = get_roll_options(html);
    let total_modifiers = 0;
    options.suppressChat = true;
    let roll_mods = actor._buildTraitRollModifiers(
        skill.data.data, options);
    let roll = actor.rollSkill(skill_id, options);
    // Customize flavour text
    let flavour =
        `${skill.name} ${game.i18n.localize('BRSW.SkillTest')}<br>`;
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
        await create_result_card(actor, roll.terms[0].values, total_modifiers,
            options.tn, options.rof);
    }
}
