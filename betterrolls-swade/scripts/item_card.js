// Functions for cards representing all items but skills

import {
    BRSW_CONST, create_basic_chat_data, create_render_options, detect_fumble,
    get_action_from_click, get_actor_from_ids, get_actor_from_message, get_roll_options, spend_bennie, trait_to_string
} from "./cards_common.js";
import {create_result_card, show_fumble_card} from "./result_card.js";
import {create_item_damage_card} from "./damage_card.js";


const ARCANE_SKILLS = ['faith', 'focus', 'spellcasting', `glaube`, 'fokus',
    'zaubern', 'druidism', 'elementalism', 'glamour', 'heahwisardry',
    'hrimwisardry', 'solar magic', 'song magic', 'soul binding', 'artificer',
    'astrology', 'dervish', 'divination', 'jinn binding', 'khem-hekau',
    'mathemagic', 'sand magic', "sha'ir", 'ship magic', 'ushabti',
    'wizir magic', 'word magic', 'druidenmagie', 'elementarmagie', 'heahmagie',
    'hrimmagie', 'gesangsmagie', 'psiónica', 'psionica', 'fe', 'hechicería',
    'hechiceria', 'foi', 'magie', 'science étrange', 'science etrange',
    'élémentalisme', 'elementalisme', 'druidisme', 'magie solaire',
    'weird science'];
const FIGHTING_SKILLS = ["fighting", "kämpfen", "pelear", "combat"];
const SHOOTING_SKILLS = ["shooting", "schiessen", "disparar", "tir"];
const THROWING_SKILLS = ["athletics", "athletik", "atletismo", "athletisme",
    "athlétisme"];
const UNTRAINED_SKILLS = ["untrained", "untrainiert", "desentrenada",
    "non entraine", "non entrainé"];


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
    const skill = get_item_skill(item, actor);
    const skill_title = skill ? skill.name + ' ' +
        trait_to_string(skill.data.data) : '';
    const notes = item.data.data.notes || (skill === undefined ? item.name : skill.name);
    let render_object = create_render_options(
        actor, {actor: actor, header: {type: 'Item', title: item.name,
            notes: notes, img: item.img}, footer: footer, damage: item.data.data.damage,
            description: item.data.data.description, skill: skill,
            skill_title: skill_title, show_rof: skill !== undefined})
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
* Creates an item card from a token or actor id, mainly for use in macros
*
* @param {string} token_id A token id, if it can be solved it will be used
*  before actor
* @param {string} actor_id An actor id, it could be set as fallback or
*  if you keep token empty as the only way to find the actor
* @param {string} skill_id: Id of the skill item
* @return {Promise} a promise fot the ChatMessage object
*/
function create_item_card_from_id(token_id, actor_id, skill_id){
    const actor = get_actor_from_ids(token_id, actor_id);
    return create_item_card(actor, skill_id);
}


/**
 * Hooks the public functions to a global object
 */
export function item_card_hooks() {
    game.brsw.create_item_card = create_item_card;
    game.brsw.create_item_card_from_id = create_item_card_from_id;
    game.brsw.roll_item = roll_item;
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
    let message = await create_item_card(target, item_id);
    if (action.includes('trait')) {
        await roll_item(message, '', false, {});
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
    let item_li = html.find('.gear-card.item, .item.flexrow')
    item_li.attr('draggable', 'true');
    item_li.bindFirst('dragstart',async ev => {
        const item_id = ev.currentTarget.dataset.itemId;
        const macro_data = {name: "Item roll", type: "script", scope: "global"};
        const token_id = app.token ? app.token.id : '';
        const actor_id = app.object ? app.object.id : '';
        macro_data.command =
            `game.brsw.create_item_card_from_id('${token_id}', '${actor_id}', '${item_id}').then(
             message => {game.brsw.roll_item(message, "", false, {})});`;
        ev.originalEvent.dataTransfer.setData(
            'text/plain', JSON.stringify({type:'Macro', data: macro_data}));
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
    });
    html.find('#roll-button').click(async _ =>{
        await roll_item(message, html, false, {});
    });
    html.find('#damage-button').click(_ => {
        const actor = get_actor_from_message(message);
        // noinspection JSIgnoredPromiseFromCall
        create_item_damage_card(actor, message.getFlag(
            'betterrolls-swade', 'item_id'));
    });
}


/**
 * Creates a footer useful for an item.
 */
export function make_item_footer(item) {
    let footer = [];
    if (item.type === "weapon"){
        footer.push(game.i18n.localize("SWADE.Rng") + ": " +  
            item.data.data.range);
        // noinspection JSUnresolvedVariable
        footer.push(game.i18n.localize("SWADE.RoF") +
            ": "+ item.data.data.rof);
        // noinspection JSUnresolvedVariable
        footer.push(game.i18n.localize("BRSW.Dmg") + ": " + 
            item.data.data.damage);
        footer.push(game.i18n.localize("SWADE.Ap") + ": " + 
            item.data.data.ap);
        if (parseInt(item.data.data.shots)) {
            // noinspection JSUnresolvedVariable
            footer.push(game.i18n.localize("SWADE.Mag") + ": " +
                item.data.data.currentShots + "/" + item.data.data.shots)
        }
    } else if (item.type === "power"){
        // noinspection JSUnresolvedVariable
        footer.push(game.i18n.localize("SWADE.PP") + ": " + item.data.data.pp);
        footer.push(game.i18n.localize("SWADE.Rng") + ": " + 
            item.data.data.range);
        footer.push(game.i18n.localize("SWADE.Dur") + ": " +
            item.data.data.duration);
        // noinspection JSUnresolvedVariable
        if (item.data.data.damage) {
            // noinspection JSUnresolvedVariable
            footer.push(game.i18n.localize("BRSW.Dmg") + ": " +
                item.data.data.damage);
        }
    } else if (item.type === "armor") {
        footer.push(game.i18n.localize("SWADE.Armor") + ": " + item.data.data.armor);
        // noinspection JSUnresolvedVariable
        footer.push(game.i18n.localize("BRSW.MinStr") + ": " + item.data.data.minStr);
        let locations = game.i18n.localize("BRSW.Location") + ": "
        for (let armor_location in item.data.data.locations) {
            if (item.data.data.locations.hasOwnProperty(armor_location) &&
                    item.data.data.locations[armor_location]) {
                locations += armor_location;
            }
        }
        footer.push(locations)
    } else if (item.type === "shield") {
        footer.push(game.i18n.localize("SSO.Parry") + ": " + item.data.data.parry);
        // noinspection JSUnresolvedVariable
        footer.push(game.i18n.localize("SWADE.Cover") + ": " + item.data.data.cover);
    }
    return footer
}


/**
 * Guess the skill that should be rolled for an item
 * @param {SwadeItem} item The item.
 * @param {SwadeActor} actor The owner of the iem
 */
function get_item_skill(item, actor) {
    // Some types of items doesn't have an associated skill
    if (['armor', 'shield', 'gear', 'edge', 'hindrance'].includes(
            item.type.toLowerCase())) return;
    // First if the item has a skill in actions we use it
    if (item.data.data.actions && item.data.data.actions.skill) {
        return skill_from_string(actor, item.data.data.actions.skill);
    }
    // Now check if there is something in the Arcane field
    // noinspection JSUnresolvedVariable
    if (item.data.data.arcane) {
        // noinspection JSUnresolvedVariable
        return skill_from_string(actor, item.data.data.arcane);
    }
    // If there is no skill anyway we are left to guessing
    let skill;
    if (item.type === "power") {
        skill = check_skill_in_actor(actor, ARCANE_SKILLS);
    } else if (item.type === "weapon") {
        if (parseInt(item.data.data.range) > 0) {
            // noinspection JSUnresolvedVariable
            if (item.data.data.damage.includes('str')) {
                skill = check_skill_in_actor(actor, THROWING_SKILLS);
            } else {
                skill = check_skill_in_actor(actor, SHOOTING_SKILLS);
            }
        } else {
            skill = check_skill_in_actor(actor, FIGHTING_SKILLS);
        }
    }
    if (skill === undefined) {
        skill = check_skill_in_actor(actor, UNTRAINED_SKILLS);
    }
    return skill;
}


/***
 * Checks if a skill is fighting, likely not the best way
 *
 * @param skill
 * @return {boolean}
 */
function is_this_fighting(skill) {
    return FIGHTING_SKILLS.includes(skill.name.toLowerCase());
}


/**
 * Gets the parry value of the selected token
 */
function get_parry_from_target() {
    /**
     * Sets the difficulty as the parry value of the targeted
     * or selected token
     */
    let targets = game.user.targets;
    let objective;
    let target_number;
    if (targets.size) objective = Array.from(targets)[0];
    if (objective) {
        target_number = parseInt(objective.actor.data.data.stats.parry.value)
    }
    return target_number;
}


/**
 * Get an skill from an actor and the skill name
 * @param {SwadeActor} actor Where search for the skill
 * @param {string} skill_name
 */
function skill_from_string(actor, skill_name) {
    return  actor.items.find(skill => {
        return skill.name.toLowerCase() === skill_name.toLowerCase();
    });
}


/**
 * Check if an actor has a skill in a list
 * @param {SwadeActor} actor
 * @param {[string]} possible_skills List of skills to check
 * @return {SwadeItem} found skill or undefined
 */
function check_skill_in_actor(actor, possible_skills) {
    let skill_found;
    actor.items.forEach((skill) => {
        if (possible_skills.includes(skill.name.toLowerCase()) && skill.type === 'skill') {
            skill_found = skill;
        }
    });
    // noinspection JSUnusedAssignment
    return skill_found;
}


export async function roll_item(message, html, expend_bennie, default_options){
    const actor = get_actor_from_message(message)
    const item_id = message.getFlag('betterrolls-swade', 'item_id');
    const item = actor.items.find((item) => item.id === item_id);
    const skill = get_item_skill(item, actor);
    if (expend_bennie) spend_bennie(actor);
    let options = get_roll_options(html, default_options);
    if (! default_options.hasOwnProperty('additionalMods')) {
        // If we are in a new roll with no data from before
        // noinspection JSUnresolvedVariable
        if (item.data.data.actions.skillMod) {
            // noinspection JSUnresolvedVariable
            let action_mod = item.data.data.actions.skillMod;
            // Add a plus sign if needed
            action_mod = '+-'.includes(action_mod.slice(0, 1)) ? action_mod :
                "+" + action_mod;
            options.additionalMods.push(action_mod);
        }
        // If this is a new roll we also default tn to parry for melee attacks
        if (is_this_fighting(skill)) {
            options.tn = get_parry_from_target() || options.tn
        }
    }
    let total_modifiers = 0;
    options.suppressChat = true;
    let roll_mods = actor._buildTraitRollModifiers(
        skill.data.data, options);
    let roll = actor.rollSkill(skill.id, options);
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
            options.tn, options.rof, message.id, options);
    }
}