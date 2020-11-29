// Functions for cards representing skills

import {BRSW_CONST, create_basic_chat_data, create_render_options,
    trait_to_string} from "./cards_common.js";

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
    console.log(skill)
    const notes = skill.name + ' ' + trait_to_string(skill.data.data)
    let chatData = create_basic_chat_data(actor, CONST.CHAT_MESSAGE_TYPES.IC);
    let render_object = create_render_options(
        actor, {actor: actor, header: {type: 'Skill', title: skill.name,
            notes: notes}, footer: {}})
    chatData.content = await renderTemplate(
        "modules/betterrolls-swade/templates/skill_card.html", render_object);
    let message = await ChatMessage.create(chatData);
    await message.setFlag('betterrolls-swade', 'card_type',
        BRSW_CONST.TYPE_SKILL_CARD)
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
export function skill_card_hooks() {
    game.brsw.create_skill_card = create_skill_card;
}