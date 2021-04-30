// Functions for cards representing skills

import {
    BRSW_CONST,
    BRWSRoll,
    create_common_card,
    get_action_from_click,
    get_actor_from_ids,
    get_actor_from_message,
    roll_trait,
    spend_bennie,
    trait_to_string
} from "./cards_common.js";

export const FIGHTING_SKILLS = ["fighting", "kämpfen", "pelear", "combat"];
export const SHOOTING_SKILLS = ["shooting", "schiessen", "disparar", "tir"];
export const THROWING_SKILLS = ["athletics", "athletik", "atletismo", "athletisme",
    "athlétisme", "★ athletics"];

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
    const extra_name = skill.name + ' ' + trait_to_string(skill.data.data)
    const footer = [game.i18n.localize('BRSW.Attribute') + ": " + skill.data.data.attribute]
    let trait_roll = new BRWSRoll();
    let message = await create_common_card(origin, {header:
                {type: game.i18n.localize("ITEM.TypeSkill"),
                    title: extra_name, img: skill.img},
            footer: footer, trait_roll: trait_roll},
        CONST.CHAT_MESSAGE_TYPES.ROLL,
        "modules/betterrolls-swade2/templates/skill_card.html")
    await message.setFlag('betterrolls-swade2', 'skill_id',
        skill_id)
    await message.setFlag('betterrolls-swade2', 'card_type',
        BRSW_CONST.TYPE_SKILL_CARD)
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
    let message = await create_skill_card(
        target, skill_id);
    if (action.includes('trait')) {
        await roll_skill(message, '', false)
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
        const token_id = app.token ? app.token.id : '';
        const actor_id = app.object ? app.object.id : '';
        const actor = game.actors.get(actor_id);
        const item = actor.getOwnedItem(skill_id);
        let macro_data = {name: `${actor.name}: ${item.name}`, type: "script",
            scope: "global", img: item.img};
        macro_data.command = `game.brsw.create_skill_card_from_id('${token_id}', '${actor_id}', '${skill_id}').then(
            message => {game.brsw.roll_skill(message, "", false)})`;
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
    html.find('.brsw-roll-button').click(async ev =>{
        await roll_skill(message, html, ev.currentTarget.classList.contains(
            'roll-bennie-button'));
    });
    html.find('.brsw-header-img').click(_ => {
        const actor = get_actor_from_message(message);
        const item = actor.getOwnedItem(message.getFlag(
            'betterrolls-swade2', 'skill_id'));
        item.sheet.render(true);
    })
}


/**
 * Roll a skill showing the roll card and the result card when enables
 *
 * @param {ChatMessage} message
 * @param {string} html Current HTML code of the message
 * @param {boolean} expend_bennie, True if we want to spend a bennie
*/
export async function roll_skill(message, html, expend_bennie){
    const actor = get_actor_from_message(message)
    const skill_id = message.getFlag('betterrolls-swade2', 'skill_id');
    const skill = actor.items.find((item) => item.id === skill_id);
    if (expend_bennie) await spend_bennie(actor);
    await roll_trait(message, skill.data.data , game.i18n.localize(
        "BRSW.SkillDie"), html, {});
}

/***
 * Checks if a skill is fighting, likely not the best way
 *
 * @param skill
 * @return {boolean}
 */
export function is_skill_fighting(skill) {
    return FIGHTING_SKILLS.includes(skill.name.toLowerCase());
}

/***
 * Checks if a skill is shooting.
 * @param skill
 * @return {boolean}
 */
export function is_shooting_skill(skill) {
    let shooting_names = SHOOTING_SKILLS;
    shooting_names.push(game.i18n.localize("BRSW.ShootingSkill"));
    return shooting_names.includes(skill.name.toLowerCase());
}

/***
 * Checks if a skill is throwing
 * @param skill
 * @return {boolean}
 */
export function is_throwing_skill(skill) {
    let shooting_names = THROWING_SKILLS;
    shooting_names.push(game.i18n.localize("BRSW.ThrowingSkill"));
    return shooting_names.includes(skill.name.toLowerCase());
}

/**
 * Get a target number and modifiers from a token appropriated to a skill
 *
 * @param {Item} skill
 * @param {Token} target_token
 * @param {Token} origin_token
 * @param {SwadeItem} item
 */
export function get_tn_from_token(skill, target_token, origin_token, item) {
    let tn = {reason: game.i18n.localize("BRSW.Default"), value: 4,
        modifiers:[]};
    let use_parry_as_tn = false;
    if (is_skill_fighting(skill)) {
        use_parry_as_tn = true;
    } else if (is_shooting_skill(skill) || is_throwing_skill(skill)) {
        const grid_unit = canvas.grid.grid.options.dimensions.distance
        let distance = canvas.grid.measureDistance(
            origin_token, target_token, {gridSpaces: true})
        if (distance < grid_unit * 2) {
            use_parry_as_tn = true;
        } else if (item) {
            const range = item.data.data.range.split('/')
            distance = distance / grid_unit;
            let distance_penalty = 0;
            for (let i=0; i<3 && i<range.length; i++) {
                let range_int = parseInt(range[i])
                if (range_int && range_int < distance) {
                    distance_penalty = i < 2 ? (i + 1) * 2 : 8;
                }
            }
            if (distance_penalty) {
                tn.modifiers.push(
                    {'name': game.i18n.localize("BRSW.Range") + " " +
                            distance.toFixed(2),
                    'value': - distance_penalty})
            }
        }
    }
    if (use_parry_as_tn) {
        tn.reason = `${game.i18n.localize("SWADE.Parry")} - ${target_token.name}`;
        tn.value = parseInt(target_token.actor.data.data.stats.parry.value);
        const parry_mod = parseInt(target_token.actor.data.data.stats.parry.modifier);
        if (parry_mod) {
            tn.value += parry_mod;
        }
    }
    // noinspection JSUnresolvedVariable
    if (target_token.actor.data.data.status.isVulnerable ||
            target_token.actor.data.data.status.isStunned) {
        tn.modifiers.push(
            {name: `${target_token.name}: ${game.i18n.localize('SWADE.Vuln')}`,
                value: 2});
    }
    return tn;
}

