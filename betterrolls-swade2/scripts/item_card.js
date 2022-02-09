// Functions for cards representing all items but skills
/* globals Token, TokenDocument, game, CONST, canvas, console, CONFIG, ChatMessage, ui, Hooks, Dialog, Roll */
// noinspection JSCheckFunctionSignatures

import {
    BRSW_CONST,
    BRWSRoll,
    calculate_results,
    check_and_roll_conviction, create_common_card, get_action_from_click,
    get_actor_from_message, get_roll_options, roll_trait, spend_bennie,
    update_message, has_joker, create_modifier, process_common_actions,
    process_minimum_str_modifiers, apply_status
} from "./cards_common.js";
import {FIGHTING_SKILLS, is_shooting_skill, SHOOTING_SKILLS, THROWING_SKILLS} from "./skill_card.js"
import {get_targeted_token, makeExplotable, broofa, simple_form} from "./utils.js";
import {create_damage_card} from "./damage_card.js";
import {create_actions_array, get_global_action_from_name} from "./global_actions.js";
import {ATTRIBUTES_TRANSLATION_KEYS} from "./attribute_card.js";
let TEMPLATE_CLASS;
import("/systems/swade/module/documents/SwadeMeasuredTemplate.js").then((result) => {
    TEMPLATE_CLASS = result;
}).catch(() => {TEMPLATE_CLASS = null})


const ARCANE_SKILLS = ['faith', 'focus', 'spellcasting', `glaube`, 'fokus',
    'zaubern', 'druidism', 'elementalism', 'glamour', 'heahwisardry',
    'hrimwisardry', 'solar magic', 'song magic', 'soul binding', 'artificer',
    'astrology', 'dervish', 'divination', 'jinn binding', 'khem-hekau',
    'mathemagic', 'sand magic', "sha'ir", 'ship magic', 'ushabti',
    'wizir magic', 'word magic', 'druidenmagie', 'elementarmagie', 'heahmagie',
    'hrimmagie', 'gesangsmagie', 'psiónica', 'psionica', 'fe', 'hechicería',
    'hechiceria', 'foi', 'magie', 'science étrange', 'science etrange',
    'élémentalisme', 'elementalisme', 'druidisme', 'magie solaire',
    'weird science', 'voidomancy'];
const UNTRAINED_SKILLS = ["untrained", "untrainiert", "desentrenada",
    "non entraine", "non entrainé", "unskilled", "unskilled attempt"];

const ROF_BULLETS = {1: 1, 2: 5, 3: 10, 4: 20, 5: 40, 6: 50}

/**
 * Creates a chat card for an item
 *
 * @param {Token, SwadeActor} origin  The actor or token owning the attribute
 * @param {string} item_id The id of the item that we want to show
 * @param {boolean} collapse_actions True if the action selector should start collapsed
 * @property {Object} item.data.data.actions.additional Additional actions.
 * @property {string} CONST.CHAT_MESSAGE_TYPES.ROLL
 * @return A promise for the ChatMessage object
*/
async function create_item_card(origin, item_id, collapse_actions) {
    let actor;
    if (origin instanceof TokenDocument || origin instanceof Token) {
        actor = origin.actor;
    } else {
        actor = origin;
    }
    const item = actor.items.find(item => {return item.id === item_id});
    let footer = make_item_footer(item);
    const trait = get_item_trait(item, actor);
    const notes = item.data.data.notes || "";
    let trait_roll = new BRWSRoll();
    let action_groups = {};
    let possible_default_dmg_action;
    if (!game.settings.get('betterrolls-swade2', 'hide-weapon-actions')) {
        let item_actions = []
        for (let action in item.data.data?.actions?.additional) {
            // noinspection JSUnresolvedVariable
            if (item.data.data.actions.additional.hasOwnProperty(action)) {
                // noinspection JSUnresolvedVariable
                const has_skill_mod =
                    !!(item.data.data.actions.additional[action].skillMod ||
                        item.data.data.actions.additional[action].skillOverride);
                const has_dmg_mod =
                    !!item.data.data.actions.additional[action].dmgMod;
                item_actions.push(
                    {'code': action, 'name': item.data.data.actions.additional[action].name,
                        pinned: false, damage_icon: has_dmg_mod,
                        skill_icon: has_skill_mod});
                // noinspection JSUnresolvedVariable
                if (!possible_default_dmg_action &&
                        item.data.data.actions.additional[action].dmgOverride) {
                    // noinspection JSUnresolvedVariable
                    possible_default_dmg_action =
                        item.data.data.actions.additional[action].dmgOverride;
                }
            }
        }
        if (item_actions.length) {
            const name = game.i18n.localize("BRSW.ItemActions")
            action_groups[name] = {name: name, actions: item_actions, id: broofa()}
        }
    }
    let ammon_enabled = parseInt(item.data.data.shots) ||
        (item.data.data.autoReload && item.data.data.ammo)
    let power_points = parseFloat(item.data.data.pp);
    const subtract_select = ammon_enabled ? game.settings.get(
        'betterrolls-swade2', 'default-ammo-management') : false;
    const subtract_pp_select =  power_points ? game.settings.get(
        'betterrolls-swade2', 'default-pp-management') : false;
    let damage = item.data.data.damage;
    if (!damage && possible_default_dmg_action) {
        damage = possible_default_dmg_action;
    }
    let actions = create_actions_array(action_groups, item, actor);
    let message = await create_common_card(origin,
        {header: {type: 'Item', title: item.name,
            img: item.img}, notes: notes,  footer: footer, damage: damage,
            trait_id: trait ? (trait.id || trait) : false, ammo: ammon_enabled,
            subtract_selected: subtract_select, subtract_pp: subtract_pp_select,
            trait_roll: trait_roll, damage_rolls: [],
            powerpoints: power_points, action_groups: actions[0],
            extra_text: actions[1], used_shots: 0,
            actions_collapsed: collapse_actions,
            swade_templates: get_template_from_description(item)},
            CONST.CHAT_MESSAGE_TYPES.ROLL,
        "modules/betterrolls-swade2/templates/item_card.html")
    await message.setFlag('betterrolls-swade2', 'item_id',
        item_id)
    await message.setFlag('betterrolls-swade2', 'card_type',
        BRSW_CONST.TYPE_ITEM_CARD)
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
    let origin;
    if (canvas) {
        if (token_id) {
            let token = canvas.tokens.get(token_id);
            if (token) {
                origin = token;
            }
        }
    }
    if (!origin && actor_id) {
        origin = game.actors.get(actor_id);
    }
    return create_item_card(origin, skill_id,
        game.settings.get('betterrolls-swade2', 'collapse-modifiers'));
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
    if (action === 'system') {return}
    ev.stopImmediatePropagation();
    ev.preventDefault();
    ev.stopPropagation();
    // First term for PC, second one for NPCs
    const item_id = ev.currentTarget.parentElement.dataset.itemId ||
        ev.currentTarget.parentElement.parentElement.dataset.itemId ||
        ev.currentTarget.parentElement.parentElement.parentElement.dataset.itemId
    const collapse_actions = action.includes('trait') || action.includes('damage') ||
        game.settings.get('betterrolls-swade2', 'collapse-modifiers');
    // Show card
    let message = await create_item_card(target, item_id, collapse_actions);
    // Shortcut for rolling damage
    if (ev.currentTarget.classList.contains('damage-roll')) {
        await roll_dmg(message, $(message.data.content), false, false);
    }
    if (action.includes('trait')) {
        await roll_item(message, $(message.data.content), false,
            action.includes('damage'));
    }
}

/**
 * Overrides the default dragstart handle to allow itemIds in another parts
 * of the tag chain
 * @param ev
 */
function drag_start_handle(ev) {
    if (! ev.currentTarget.dataset.itemId) {
        ev.currentTarget.dataset.itemId =
            ev.currentTarget.parentElement.dataset.itemId ||
            ev.currentTarget.parentElement.parentElement.dataset.itemId ||
            ev.currentTarget.parentElement.parentElement.parentElement.dataset.itemId
    }
    ev.data.app._onDragStart(ev.originalEvent)
}

/**
 * Activates the listeners in the character sheet in items
 * @param app: Sheet app
 * @param html: Html code
 */
export function activate_item_listeners(app, html) {
    let target = app.token?app.token:app.object;
    const item_images = html.find(
        '.item-image, .item-img, .name.item-show, span.item>.item-control.item-edit,' +
        ' .gear-card>.card-header>.item-name, .damage-roll, .item-name>h4,' +
        ' .power-header>.item-name, .card-button, .item-control.item-show,' +
        ' .power button.item-show, .weapon button.item-show');
    item_images.bindFirst('click', async ev => {
        await item_click_listener(ev, target);
    });
    let item_li = html.find('.gear-card.item, .item.flexrow, .power.item, .weapon.item')
    item_li.attr('draggable', 'true');
    item_li.off('dragstart')
    item_li.bind('dragstart', {app: app}, drag_start_handle);
}


/**
 * Activate the listeners in the item card
 * @param message: Message date
 * @param html: Html produced
 */
export function activate_item_card_listeners(message, html) {
    const actor = get_actor_from_message(message);
    const item = actor.items.get(message.getFlag(
        'betterrolls-swade2', 'item_id'));
    const ammo_button = html.find('.brws-selected.brsw-ammo-toggle');
    const pp_button = html.find('.brws-selected.brsw-pp-toggle')
    html.find('.brsw-header-img').click(_ => {
        item.sheet.render(true);
    });
    html.find('.brsw-roll-button').click(async ev =>{
        await roll_item(message, html, ev.currentTarget.classList.contains(
            'roll-bennie-button'));
    });
    html.find('.brsw-damage-button, .brsw-damage-bennie-button').click((ev) => {
        // noinspection JSIgnoredPromiseFromCall
        roll_dmg(message, html, ev.currentTarget.classList.contains('brsw-damage-bennie-button'),
            {}, ev.currentTarget.id.includes('raise'));
    });
    html.find('.brsw-false-button.brsw-ammo-manual').click(() => {
        ammo_button.removeClass('brws-selected');
        manual_ammo(item, actor);
    });
   html.find('.brsw-false-button.brsw-pp-manual').click(() => {
       pp_button.removeClass('brws-selected');
       // noinspection JSIgnoredPromiseFromCall
       manual_pp(actor, item);
    });
   html.find('.brsw-apply-damage').click((ev) => {
       create_damage_card(ev.currentTarget.dataset.token,
           ev.currentTarget.dataset.damage,
           `${actor.name} - ${item.name}`).then();
   });
   html.find('.brsw-target-tough').click(ev => {
      // noinspection JSIgnoredPromiseFromCall
       edit_tougness(message, ev.currentTarget.dataset.index);
   });
   html.find('.brsw-add-damage-d6').click(ev => {
       // noinspection JSIgnoredPromiseFromCall
       add_damage_dice(message, ev.currentTarget.dataset.index);
   })
    html.find('.brsw-half-damage').click(ev => {
        // noinspection JSIgnoredPromiseFromCall
        half_damage(message, ev.currentTarget.dataset.index);
    })
    html.find('.brsw-add-damage-number').bind(
        'click', {message: message}, show_fixed_damage_dialog)
    html.find('.brsw-template-button').on('click', ev => {
        let templateData = {
            user: game.user.id,
            distance: 0,
            direction: 0,
            x: 0,
            y: 0,
            fillColor: game.user.data.color,
        };
        const type = ev.currentTarget.dataset.size
        if (type === 'cone') {
            templateData.t = 'cone'
            templateData.distance = 9
        } else {
            templateData.t = 'circle'
            templateData.distance = type === 'sbt' ? 1 : (type === 'mbt' ? 2 : 3)
        }
        // Adjust to grid distance
        if (canvas.grid.grid.options.dimensions.distance % 5 === 0) {
            templateData.distance *= 5
        }
        // noinspection JSPotentiallyInvalidConstructorUsage
        const template_base = new CONFIG.MeasuredTemplate.documentClass(
            templateData, { parent: canvas.scene });
        let template = new TEMPLATE_CLASS.default(template_base)
        template.drawPreview(ev)
    })
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
                const location_formatted = armor_location.charAt(0).toUpperCase() +
                    armor_location.slice(1)
                locations += game.i18n.localize(`SWADE.${location_formatted}`) + " ";
            }
        }
        footer.push(locations)
    } else if (item.type === "shield") {
        footer.push(game.i18n.localize("SWADE.Parry") + ": " + item.data.data.parry);
        // noinspection JSUnresolvedVariable
        footer.push(game.i18n.localize("SWADE.Cover") + ": " + item.data.data.cover);
    }
    return footer
}


/**
 * Guess the skill/attribute that should be rolled for an item
 * @param {Item} item The item.
 * @param {string} item.data.data.arcane
 * @param {Object} item.data
 * @param {Object} item.data.data.actions
 * @param {string} item.data.data.range
 * @param {SwadeActor} actor The owner of the iem
 */
export function get_item_trait(item, actor) {
    // First if the item has a skill in actions we use it
    if (item.data.data.actions && item.data.data.actions.skill) {
        return trait_from_string(actor, item.data.data.actions.skill);
    }
    // Some types of items don't have an associated skill
    if (['armor', 'shield', 'gear', 'edge', 'hindrance'].includes(
            item.type.toLowerCase())) {return}
    // Now check if there is something in the Arcane field
    if (item.data.data.arcane) {
        return trait_from_string(actor, item.data.data.arcane);
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
        skill = check_skill_in_actor(actor, UNTRAINED_SKILLS) ||
            check_skill_in_actor(actor, game.i18n.localize("BRSW.SkillName-untrained"));
    }
    return skill;
}



/**
 * Get a skill or attribute from an actor and the skill name
 * @param {SwadeActor} actor Where search for the skill
 * @param {Object} actor.data
 * @param {Array} actor.items
 * @param {string} trait_name
 */
function trait_from_string(actor, trait_name) {
    let skill = actor.items.find(skill => {
        return skill.name.toLowerCase().replace('★ ', '') ===
            trait_name.toLowerCase().replace('★ ', '') &&
            skill.type === 'skill';
    });
    if (!skill) {
        // Time to check for an attribute
        const ATTRIBUTES = ['agility', 'smarts', 'spirit', 'strength', 'vigor']
        for (let attribute of ATTRIBUTES) {
            const translation = game.i18n.localize(ATTRIBUTES_TRANSLATION_KEYS[attribute])
            if (trait_name.toLowerCase() === translation.toLowerCase())  {
                return {data: {data: actor.data.data.attributes[attribute.toLowerCase()]},
                        name: translation}
            }
        }
    }
    if (!skill) {
        // No skill was found, we try to find untrained
        skill = check_skill_in_actor(actor, UNTRAINED_SKILLS);
    }
    return skill;
}


/**
 * Check if an actor has a skill in a list
 * @param {SwadeActor} actor
 * @param {Object} actor.items
 * @param {[string]} possible_skills List of skills to check
 * @return {Item} found skill or undefined
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


/**
 * Discount ammo from an item
 *
 * @param item Item that has been shot
 * @param rof Rof of the shot
 * @param {int} shot_override
 * @return {int} used shots
 */
async function discount_ammo(item, rof, shot_override) {
    // noinspection JSUnresolvedVariable
    const ammo = parseInt(item.data.data.currentShots);
    const ammo_spent = shot_override ? shot_override : ROF_BULLETS[rof];
    const final_ammo = Math.max(ammo - ammo_spent, 0)
    // noinspection JSUnresolvedVariable
    let content = game.i18n.format("BRSW.ExpendedAmmo",
        {ammo_spent: ammo_spent, item_name: item.name, final_ammo: final_ammo});
    if (ammo_spent > ammo && !item.data.data.autoReload) {
        content = '<p class="brsw-fumble-row">Not enough ammo!</p>' + content;
    }
    await item.update({'data.currentShots': final_ammo});
    await displayRemainingCard(content);
    return ammo_spent;
}

async function displayRemainingCard(content) {
  const show_card = game.settings.get('betterrolls-swade2', 'remaining_card_behaviour');
  if (show_card !== 'none') {
    let chat_data = { content: content };
    if (show_card === 'master_and_gm') {
      chat_data.whisper = [ChatMessage.getWhisperRecipients("GM")[0]?.id];
    }
    if (show_card === 'master_only') {
      chat_data.whisper = [''];
    }
    await ChatMessage.create(chat_data);
  }
}

/**
 * Discount pps from an actor (c) Javier or Arcane Device (c) Salieri
 *
 * @param {SwadeActor} actor
 * @param {function} actor.update
 * @param item
 * @param {Roll[]} rolls
 * @param pp_override
 */
async function discount_pp(actor, item, rolls, pp_override) {
    let success = false;
    for (let roll of rolls) {
        if (roll.result >= 4) {
            success = true
        }
    }
    const base_pp_expended = pp_override ? parseInt(pp_override) : parseInt(item.data.data.pp)
    const pp = success ? base_pp_expended : 1;
    // noinspection JSUnresolvedVariable
    let current_pp;
    // If devicePP is found, it will be treated as an Arcane Device:
    let arcaneDevice = false;
    if (item.data.data.additionalStats.devicePP) {
        // Get the devices PP:
        current_pp = item.data.data.additionalStats.devicePP.value;
        arcaneDevice = true;
    }
    // Do the rest only if it is not an Arcane Device and ALSO only use the tabs PP if it has a value:
    else if (actor.data.data.powerPoints.hasOwnProperty(item.data.data.arcane) &&
             actor.data.data.powerPoints[item.data.data.arcane].max) {
        // Specific power points
        current_pp = actor.data.data.powerPoints[item.data.data.arcane].value;
    } else {
        // General pool
        current_pp = actor.data.data.powerPoints.value;
    }
    const final_pp = Math.max(current_pp - pp, 0);
    let content = game.i18n.format("BRSW.ExpendedPoints",
        {name: actor.name, final_pp: final_pp, pp: pp});
    if (current_pp < pp) {
        content = game.i18n.localize("BRSW.NotEnoughPP") +  content;
    }
    let data = {}
    if (arcaneDevice === true) {
        const updates = [
            { _id: item.id, "data.additionalStats.devicePP.value": `${final_pp}` },
          ];
          // Updating the Arcane Device:
          actor.updateEmbeddedDocuments("Item", updates);
    }
    else if (actor.data.data.powerPoints.hasOwnProperty(item.data.data.arcane) &&
             actor.data.data.powerPoints[item.data.data.arcane].max) {
        data['data.powerPoints.' + item.data.data.arcane + '.value'] =
            final_pp;
    } else {
        data['data.powerPoints.value'] = final_pp;
    }
    if (arcaneDevice === false) {
        await actor.update(data);
    }
    await displayRemainingCard(content);
    return pp
}


/**
 * Execute a list of macros
 * @param macros
 * @param actor_param
 * @param item_param
 * @param message_param
 */
export async function run_macros(macros, actor_param, item_param, message_param) {
    if (macros) {
        for (let macro_name of macros) {
            const real_macro = await find_macro(macro_name)
            if (real_macro) {
                const actor = actor_param;
                const item = item_param;
                const speaker = ChatMessage.getSpeaker();
                const token = canvas.tokens.get(speaker.token);
                const character = game.user.character;
                const targets = game.user.targets;
                const message = message_param;
                // Attempt script execution
                const body = `(async () => {${real_macro.data.command}})()`;
                const fn = Function("speaker", "actor", "token", "character", "item", "message", "targets", body); // jshint ignore:line
                try {
                  fn.call(this, speaker, actor, token, character, item, message, targets);
                } catch (err) {
                  ui.notifications.error(`There was an error in your macro syntax. See the console (F12) for details`);
                }
            }
        }
    }
}


async function find_macro(macro_name) {
    let macro = game.macros.getName(macro_name)
    if (! macro) {
        // Search compendiums
        for (let compendium of game.packs.contents) {
            if (compendium.documentClass.documentName === 'Macro') {
                let possible_macro = compendium.index.getName(macro_name)
                if (possible_macro) {
                    macro = await compendium.getDocument(possible_macro._id)
                }
            }
        }
    }
    return macro
}


/**
 * Roll the item damage
 *
 * @param message: Message that originates this roll
 * @param html: Html code to parse for extra options
 * @param expend_bennie: Whenever to expend a bennie
 * @param roll_damage: true if we want to autoroll damage
 *
 * @return {Promise<void>}
 */
export async function roll_item(message, html, expend_bennie,
                                roll_damage){
    let render_data = await message.getFlag('betterrolls-swade2', 'render_data');
    const actor = get_actor_from_message(message)
    const item_id = message.getFlag('betterrolls-swade2', 'item_id');
    const item = actor.items.find((item) => item.id === item_id);
    let trait = get_item_trait(item, actor);
    let macros = [];
    let shots_override;  // Override the number of shots used
    let extra_data = {skill: trait, modifiers: []};
    if (expend_bennie) {await spend_bennie(actor)}
    extra_data.rof = item.data.data.rof || 1;
    if (game.settings.get('betterrolls-swade2', 'default_rate_of_fire') === 'single_shot') {
        extra_data.rof = 1;
    }
    let pinned_actions = []
    // Try to recover the html from the browser
    if (!html) {
        html = $(`.chat-message.message.flexcol[data-message-id="${message._id}"]`)
    }
    // Actions
    if (html) {
        html.find('.brsw-action.brws-selected').each((_, element) => {
            // noinspection JSUnresolvedVariable
            let action;
            // noinspection JSUnresolvedVariable
            if (item.data.data.actions.additional.hasOwnProperty(element.dataset.action_id)) {
                // noinspection JSUnresolvedVariable
                action = item.data.data.actions.additional[element.dataset.action_id];
            } else {
                // GLOBAL ACTION
                // noinspection JSUnresolvedVariable
                action = get_global_action_from_name(element.dataset.action_id);
            }
            if (action.skillOverride) {
                trait = trait_from_string(actor, action.skillOverride);
                render_data.trait_id = trait.id;
            }
            // noinspection JSUnresolvedVariable
            if (action.shotsUsed) {
                shots_override = parseInt(action.shotsUsed);
            }
            let effects = process_common_actions(action, extra_data, macros, pinned_actions)
            if (effects) {
                for (let effect of effects) {
                    apply_status(actor, effect)
                }
            }
            if (element.classList.contains("brws-permanent-selected")) {
                pinned_actions.push(action.name);
            }
        });
    }
    // Check for minimum strength
    if (item.data.data.minStr && is_shooting_skill(get_item_trait(item, actor))) {
        const penalty = process_minimum_str_modifiers(item, actor, "BRSW.NotEnoughStrength");
        if (penalty) {
            extra_data.modifiers.push(penalty)
        }
    }
    // Check rof if avaliable
    const trait_data = await roll_trait(message, trait.data.data , game.i18n.localize(
        "BRSW.SkillDie"), html, extra_data)
    // Pinned actions
    for (let group in render_data.action_groups) {
        for (let action of render_data.action_groups[group].actions) {
            // Global and local actions are different
            action.pinned = pinned_actions.includes(action.code) ||
                pinned_actions.includes(action.name)
        }
    }
    // Ammo management
    if (parseInt(item.data.data.shots) || item.data.data.autoReload){
        const dis_ammo_selected = html ? html.find('.brws-selected.brsw-ammo-toggle').length :
            game.settings.get('betterrolls-swade2', 'default-ammo-management');
        if (dis_ammo_selected || macros) {
            let rof = trait_data.dice.length;
            if (actor.isWildcard) {
                rof -= 1;
            }
            if (dis_ammo_selected && !trait_data.old_rolls.length) {
                render_data.used_shots = discount_ammo(item, rof || 1, shots_override);
                if (item.data.data.autoReload) {
                    reload_weapon(actor, item, rof || 1)
                }
            } else {
                render_data.used_shots = shots_override ? shots_override : ROF_BULLETS[rof || 1];
            }
        }
    }
    // Power points management
    const pp_selected = html ? html.find('.brws-selected.brsw-pp-toggle').length :
        game.settings.get('betterrolls-swade2', 'default-pp-management');
    if (parseInt(item.data.data.pp) && pp_selected && !trait_data.old_rolls.length) {
        render_data.used_pp = await discount_pp(actor, item, trait_data.rolls, shots_override);
    }
    await update_message(message, actor, render_data);
    await run_macros(macros, actor, item, message);
    //Call a hook after roll for other modules
    Hooks.call("BRSW-RollItem", message, html);
    if (roll_damage) {
        trait_data.rolls.forEach(roll => {
            if (roll.result >= roll.tn && roll.tn > 0) {
                roll_dmg(message, html, false, {},
                    roll.result > roll.tn + 3)
            }
        });
    }
}

/**
 * Reloads a weapon
 * @param actor: Actor owning the weapon
 * @param weapon
 * @param number: Number of shots reloaded
 */
function reload_weapon(actor, weapon, number) {
    // If the quantity of ammo is less than the amount required, use whatever is left.
    let item = actor.items.get(weapon.id);
    let ammo = actor.items.getName(item.data.data.ammo)
    let ammo_quantity = 999999999;
    if (ammo) {
        if (ammo.data.data.quantity <= 0) {
            return ui.notifications.error(`${game.i18n.localize("BRSW.NoAmmoLeft")}`);
        }
        ammo_quantity = ammo.data.data.quantity;
    }
    let max_ammo = parseInt(weapon.data.data.shots);
    // noinspection JSUnresolvedVariable
    let current_ammo = parseInt(weapon.data.data.currentShots);
    let newCharges = Math.min(max_ammo, current_ammo + number,
        current_ammo + ammo_quantity);
    let updates = [{_id: weapon.id, "data.currentShots": `${newCharges}`}];
    if (ammo) {
        const reload_quantity = weapon.data.data.autoReload ?
            ammo.data.data.quantity - number :
            ammo.data.data.quantity - newCharges + current_ammo
        updates.push({_id: ammo.id, "data.quantity": reload_quantity});
    }
    actor.updateEmbeddedDocuments("Item", updates);
    ChatMessage.create({
        speaker: {
            alias: actor.name
        },
        content: `<img src=${weapon.img} alt="${weapon.name}" style="height: 2em;"><p>${game.i18n.format(
            "BRSW.ReloadStatus", {actor_name: actor.name, weapon_name: weapon.name})}</p>`
    })
}

function manual_ammo(weapon, actor) {
    // Original idea and a tiny bit of code: SalieriC#8263; most of the code: Kandashi (He/Him)#6698;
    // sound playback: Freeze#2689; chat message: Spacemandev#6256 (edited by SalieriC). Thank you all so much. =)}
    // noinspection JSUnresolvedVariable
    const currentCharges = parseInt(weapon.data.data.currentShots);
    new Dialog({
        title: 'Ammo Management',
        content: `<form>
                <div class="form-group">
                    <label for="num"># of Shots: </label>
                    <input id="num" name="num" type="number" min="0" value="1">
                </div>
            </form>`,
        default: 'one',
        buttons: {
            one: {
                label: game.i18n.localize("BRSW.Shooting"),
                callback: (html) => {
                    let number = Number(html.find("#num")[0].value);
                    const newCharges = currentCharges - number;
                    const updates = [
                        {_id: weapon.id, "data.currentShots": `${newCharges}`},
                    ];
                    if (currentCharges < number) {
                        ui.notifications.notify(game.i18n.localize("BRSW.NoAmmunition"))
                    }
                    else {
                        actor.updateEmbeddedDocuments("Item", updates);
                        ChatMessage.create({
                            speaker: {
                                alias: actor.name
                            },
                            content: `<img src=${weapon.img} alt="${weapon.name}" style="height: 2em;"> <p>${game.i18n.format(
                                "BRSW.AmmunitionStatus", 
                                {actor_name: actor.name, number: number, weapon_name: weapon.name, newCharges: newCharges})}</p>`
                        })
                    }
                }
            },
            two: {
                label: game.i18n.localize("BRSW.Reload"),
                callback: (html) => {
                    let number = Number(html.find("#num")[0].value);
                    return reload_weapon(actor, weapon, number);
                }
            },
        }
    }).render(true)
}


/**
 * If a message has an item retrieve it
 * @param message:
 * @param actor
 */
export function get_item_from_message(message, actor) {
    const item_id = message.getFlag('betterrolls-swade2', 'item_id');
    return actor.items.find((item) => item.id === item_id);
}


// DAMAGE ROLLS


/**
 * Gets the tougness value for the targeted token
 * @param {SwadeActor} acting_actor
 * @param {Token} target
 */
function get_toughness_targeted_selected(acting_actor, target=undefined) {
    let objetive = target ? target : get_targeted_token();
    if (!objetive) {
        canvas.tokens.controlled.forEach(token => {
            // noinspection JSUnresolvedVariable
            if (token.actor !== acting_actor) {
                objetive = token;
            }
        })
    }
    let defense_values = {toughness: 4, armor: 0,
        name: game.i18n.localize("BRSW.Default")};
    if (objetive && objetive.actor) {
        if (objetive.actor.data.type !== "vehicle") {
            defense_values.toughness = parseInt(
                objetive.actor.data.data.stats.toughness.value);
            defense_values.armor = parseInt(
                objetive.actor.data.data.stats.toughness.armor);
            defense_values.name = objetive.name;
            defense_values.token_id = objetive.id;
        } else {
            defense_values.toughness = parseInt(
                objetive.actor.data.data.toughness.total);
            defense_values.armor = parseInt(
                  objetive.actor.data.data.toughness.armor);
            defense_values.name = objetive.name;
            defense_values.token_id = objetive.id;
        }
    }
    return defense_values
}

/**
 * Adjust a roll formula to a strength limit
 * @param damage_roll
 * @param roll_formula
 * @param str_die_size
 * @return {string}
 */
function adjust_dmg_str(damage_roll, roll_formula, str_die_size) {
    // Minimum strength is not meet
    const new_mod = create_modifier(game.i18n.localize("BRSW.NotEnoughStrength"), 0)
    damage_roll.brswroll.modifiers.push(new_mod)
    let new_roll_formula = ''
    for (let piece of roll_formula.split('d')) {
        const piece_value = parseInt(piece)
        let new_piece = piece
        if (piece_value && (piece_value > str_die_size)) {
            new_piece = new_piece.replace(piece_value.toString(),
                str_die_size.toString())
        }
        new_roll_formula += new_piece + "d"
    }
    return new_roll_formula.slice(0, new_roll_formula.length - 1)
}


async function roll_dmg_target(damage_roll, actor, formula, raise_formula, target, total_modifiers, item, message, render_data) {
    let current_damage_roll = JSON.parse(JSON.stringify(damage_roll))
    // @zk-sn: If strength is 1, make @str not explode: fix for #211 (Str 1 can't be rolled)
    let shortcuts = actor.getRollShortcuts();
    if (shortcuts.str === "1d1x[Strength]") {
        shortcuts.str = "1d1[Strength]";
    }
    let roll = new Roll(formula + raise_formula, shortcuts);
    roll.evaluate({async: false});
    const defense_values = get_toughness_targeted_selected(actor, target);
    current_damage_roll.brswroll.rolls.push(
        {
            result: roll.total + total_modifiers, tn: defense_values.toughness,
            armor: defense_values.armor, ap: parseInt(item.data.data.ap) || 0,
            target_id: defense_values.token_id || 0
        });
    let last_string_term = ''
    for (let term of roll.terms) {
        if (term.hasOwnProperty('faces')) {
            let new_die = {
                faces: term.faces, results: [],
                extra_class: '',
                label: game.i18n.localize("SWADE.Dmg") + ` (d${term.faces})`
            };
            if (term.total > term.faces) {
                new_die.extra_class = ' brsw-blue-text';
                if (!current_damage_roll.brswroll.rolls[0].extra_class) {
                    current_damage_roll.brswroll.rolls[0].extra_class = ' brsw-blue-text';
                }
            }
            for (let result of term.results) {
                new_die.results.push(result.result);
            }
            current_damage_roll.brswroll.dice.push(new_die);
        } else {
            let integer_term = parseInt(term)
            if (integer_term) {
                let modifier_value = parseInt(last_string_term + integer_term);
                if (modifier_value) {
                    const new_mod = create_modifier(
                        game.i18n.localize("SWADE.Dmg") + ` (${modifier_value})`,
                        modifier_value)
                    current_damage_roll.brswroll.modifiers.push(new_mod);
                }
            }
            last_string_term = term;
        }
    }
    if (raise_formula) {
        // Last die is raise die.
        current_damage_roll.brswroll.dice[current_damage_roll.brswroll.dice.length - 1].label =
            game.i18n.localize("BRSW.Raise");
    }
    current_damage_roll.label = defense_values.name;
    // Dice so nice
    if (game.dice3d) {
        // Dice buried in modifiers.
        let users = null;
        if (message.data.whisper.length > 0) {
            users = message.data.whisper;
        }
        const blind = message.data.blind
        for (let modifier of damage_roll.brswroll.modifiers) {
            if (modifier.dice) {
                // noinspection ES6MissingAwait
                game.dice3d.showForRoll(modifier.dice, game.user, true, users, blind);
            }
        }
        let damage_theme = game.settings.get('betterrolls-swade2', 'damageDieTheme');
        if (damage_theme !== 'None') {
            for (let die of roll.dice) {
                die.options.colorset = damage_theme;
            }
        }
        // noinspection ES6MissingAwait
        await game.dice3d.showForRoll(roll, game.user, true, users, blind);
    }
    current_damage_roll.damage_result = await calculate_results(current_damage_roll.brswroll.rolls, true);
    render_data.damage_rolls.push(current_damage_roll);
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
    let render_data = message.getFlag('betterrolls-swade2', 'render_data');
    const actor = get_actor_from_message(message)
    const item_id = message.getFlag('betterrolls-swade2', 'item_id');
    const item = actor.items.find((item) => item.id === item_id);
    let raise_formula = '+1d6x';
    let macros = [];
    if (expend_bennie) {await spend_bennie(actor)}
    let total_modifiers = 0;
    // Calculate modifiers
    let options = get_roll_options(html, default_options);
    let roll_formula = item.data.data.damage;
    // Shotgun
    if (roll_formula === '1-3d6' && item.type === 'weapon') {
        // Bet that this is shotgun
        roll_formula = '3d6'
    }
    // Betterrolls modifiers
    let damage_roll = {label: '---', brswroll: new BRWSRoll(), raise:raise};
    options.dmgMods.forEach(mod => {
        const new_mod = create_modifier('Better Rolls', mod)
        damage_roll.brswroll.modifiers.push(new_mod);
        total_modifiers += new_mod.value;
    })
    // Action mods
    // noinspection JSUnresolvedVariable
    if (item.data.data.actions.dmgMod) {
        // noinspection JSUnresolvedVariable
        const new_mod = create_modifier(game.i18n.localize("BRSW.ItemMod"),
            item.data.data.actions.dmgMod)
        damage_roll.brswroll.modifiers.push(new_mod);
        total_modifiers += new_mod.value
    }
    // Joker
    if (has_joker(message.getFlag('betterrolls-swade2', 'token'))) {
        damage_roll.brswroll.modifiers.push(create_modifier('Joker', 2));
        total_modifiers += 2;
    }
    // Minimum strength
    if (item.data.data.minStr) {
        const splited_minStr = item.data.data.minStr.split('d')
        const min_str_die_size = parseInt(splited_minStr[splited_minStr.length - 1])
        const str_die_size = actor?.data?.data?.attributes?.strength?.die?.sides
        if (min_str_die_size && ! is_shooting_skill(get_item_trait(item, actor))) {
            if (min_str_die_size > str_die_size) {
                roll_formula = adjust_dmg_str(damage_roll, roll_formula, str_die_size);
            }
        }
    }
    // Actions
    let pinned_actions = [];
    if (html) {
        html.find('.brsw-action.brws-selected').each((_, element) => {
            let action;
            // noinspection JSUnresolvedVariable
            if (item.data.data.actions.additional.hasOwnProperty(element.dataset.action_id)) {
                // noinspection JSUnresolvedVariable
                action = item.data.data.actions.additional[element.dataset.action_id];
            } else {
                // GLOBAL ACTION
                // noinspection JSUnresolvedVariable
                action = get_global_action_from_name(element.dataset.action_id);
            }
            // noinspection JSUnresolvedVariable
            if (action.dmgMod) {
                const new_mod = create_modifier(action.name, action.dmgMod)
                damage_roll.brswroll.modifiers.push(new_mod)
                total_modifiers += new_mod.value
            }
            if (action.dmgOverride) {
                roll_formula = action.dmgOverride;
            }
            if (action.self_add_status) {
                apply_status(actor, action.self_add_status)
            }
            if (action.runDamageMacro) {
                macros.push(action.runDamageMacro);
            }
            if (action.raiseDamageFormula) {
                raise_formula = action.raiseDamageFormula;
            }
            if (action.rerollDamageMod && expend_bennie) {
                const reroll_mod = create_modifier(
                    action.name, action.rerollDamageMod)
                damage_roll.brswroll.modifiers.push(reroll_mod);
                total_modifiers += reroll_mod.value;
            }
            if (element.classList.contains("brws-permanent-selected")) {
                pinned_actions.push(action.name);
            }
        });
    }
    if (!roll_formula) {
        // Damage is empty and damage action has not been selected...
        roll_formula = "3d6" // Bet for a shotgun.
    }
    //Conviction
    const conviction_modifier = check_and_roll_conviction(actor);
    if (conviction_modifier) {
        damage_roll.brswroll.modifiers.push(conviction_modifier);
        total_modifiers += conviction_modifier.value;
    }
    // Roll
    let formula = makeExplotable(roll_formula);
    let targets = [undefined];
    if (game.user.targets.size > 0) {
        targets = await game.user.targets;
        targets = Array.from(targets).filter((token) => token.actor)
    }
    if (! raise) {raise_formula = ''}
    for (let target of targets) {
        await roll_dmg_target(damage_roll, actor, formula, raise_formula, target, total_modifiers, item, message, render_data);
    }
    // Pinned actions
    // noinspection JSUnresolvedVariable
    for (let group in render_data.action_groups) {
        for (let action of render_data.action_groups[group].actions) {
            // Global and local actions are different
            action.pinned = pinned_actions.includes(action.code) ||
                pinned_actions.includes(action.name)
        }
    }
    await update_message(message, actor, render_data);
    // Run macros
    await run_macros(macros, actor, item, message);
}


/**
 * Add a d6 to a damage roll
 * @param {ChatMessage} message
 * @param {function} message.getFlag
 * @param {int} index
 */
async function add_damage_dice(message, index) {
    let render_data = message.getFlag('betterrolls-swade2', 'render_data');
    const actor = get_actor_from_message(message);
    let damage_rolls = render_data.damage_rolls[index].brswroll;
    let roll = new Roll("1d6x");
    roll.evaluate({async:false});
    damage_rolls.rolls[0].result += roll.total;
    roll.terms.forEach(term => {
        let new_die = {
            faces: term.faces, results: [],
            extra_class: '',
            label: game.i18n.localize("SWADE.Dmg")
        };
        if (term.total > term.faces) {
            new_die.extra_class = ' brsw-blue-text';
        }
        term.results.forEach(result => {
            new_die.results.push(result.result);
        })
        damage_rolls.dice.push(new_die);
    });
    render_data.damage_rolls[index].damage_result = await calculate_results(
        damage_rolls.rolls, true);
    if (game.dice3d) {
        let damage_theme = game.settings.get('betterrolls-swade2', 'damageDieTheme');
        if (damage_theme !== 'None') {
            roll.dice.forEach(die => {
               die.options.colorset = damage_theme;
            });
        }
        let users = null;
        if (message.data.whisper.length > 0) {
            users = message.data.whisper;
        }
        // noinspection ES6MissingAwait,JSIgnoredPromiseFromCall
        game.dice3d.showForRoll(roll, game.user, true, users)
    }
    // noinspection JSIgnoredPromiseFromCall
    await update_message(message, actor, render_data)
}


async function show_fixed_damage_dialog(event) {
    // noinspection AnonymousFunctionJS
    simple_form(game.i18n.localize("BRSW.EditModifier"),
        [{label: 'Label', default_value: 'Mod'},
               {label:'Value', default_value: 0}],
        (values) => {add_fixed_damage(event, values)})
}


/**
 * Adds a fixed ammount of damage to a roll
 * @param event
 * @param form_results
 */
async function add_fixed_damage(event, form_results) {
    const modifier = parseInt(form_results.Value)
    if (! modifier) {return}
    const index = event.currentTarget.dataset.index
    const actor = get_actor_from_message(event.data.message);
    let render_data = event.data.message.getFlag('betterrolls-swade2', 'render_data')
    let damage_rolls = render_data.damage_rolls[index].brswroll
    damage_rolls.modifiers.push(
        {value: modifier, name: form_results.Label})
    damage_rolls.rolls[0].result += modifier
    render_data.damage_rolls[index].damage_result += await calculate_results(
        damage_rolls.rolls, true)
    await update_message(event.data.message, actor, render_data)
}


/**
 * Change damage to half
 * @param {ChatMessage} message
 * @param {function} message.getFlag
 * @param {number} index
 */
async function half_damage(message, index){
    const actor = get_actor_from_message(message);
    let render_data = message.getFlag('betterrolls-swade2', 'render_data');
    let damage_rolls = render_data.damage_rolls[index].brswroll;
    const half_damage = - Math.round(damage_rolls.rolls[0].result / 2);
    damage_rolls.modifiers.push(
        {'value': half_damage,
            'name': game.i18n.localize("BRSW.HalfDamage")});
    damage_rolls.rolls[0].result += half_damage;
    render_data.damage_rolls[index].damage_result = await calculate_results(
        damage_rolls.rolls, true);
    await update_message(message, actor, render_data);
}


/**
 * Changes the damage target of one of the rolls.
 *
 * @param {ChatMessage} message
 * @param {function} message.getFlag
 * @param {int} index:
 */
async function edit_tougness(message, index) {
    let render_data = message.getFlag('betterrolls-swade2', 'render_data');
    const actor = get_actor_from_message(message);
    const defense_values = get_toughness_targeted_selected(actor);
    let damage_rolls = render_data.damage_rolls[index].brswroll.rolls;
    damage_rolls[0].tn = defense_values.toughness;
    damage_rolls[0].armor = defense_values.armor;
    damage_rolls[0].target_id = defense_values.token_id || 0;
    render_data.damage_rolls[index].label = defense_values.name;
    render_data.damage_rolls[index].damage_result = await calculate_results(
        damage_rolls, true);
    // noinspection JSIgnoredPromiseFromCall
    await update_message(message, actor, render_data)
}


/**
 * Function to manually manage power points (c) SalieriC
 * @param {SwadeActor} actor
 * @param {function} actor.update
 * @param {Item} item
 */
async function manual_pp(actor, item) {
    // noinspection JSUnresolvedVariable
    let ppv = actor.data.data.powerPoints.value;
    // noinspection JSUnresolvedVariable
    let ppm = actor.data.data.powerPoints.max;
    // Activator and resources for Arcane Devices:
    let arcaneDevice = false;
    let otherArcane = false;
    let data = {}
    if (item.data.data.additionalStats.devicePP){
        arcaneDevice = true;
        ppv = item.data.data.additionalStats.devicePP.value;
        ppm = item.data.data.additionalStats.devicePP.max;
    }
    else if (actor.data.data.powerPoints.hasOwnProperty(item.data.data.arcane) &&
             actor.data.data.powerPoints[item.data.data.arcane].max) {
        // Specific power points
        otherArcane = true;
        ppv = actor.data.data.powerPoints[item.data.data.arcane].value;
        ppm = actor.data.data.powerPoints[item.data.data.arcane].max;
    }
    const fv = actor.data.data.fatigue.value;
    const fm = actor.data.data.fatigue.max;
    const ammout_pp = game.i18n.localize("BRSW.AmmountPP");
    new Dialog({
        title: game.i18n.localize("BRSW.PPManagement"),
        content: `<form> <div class="form-group"> 
            <label for="num">${ammout_pp}: </label>
             <input id="num" name="num" type="number" min="0" value="5">
              </div> </form>`,
        default: 'one',
        buttons: {
            one: {
                label: game.i18n.localize("BRSW.ExpendPP"),
                callback: (html) => {
                    //Button 1: Spend Power Points (uses a number given that reduces data.powerPoints.value (number field)) but can't be lower than 0.
                    let number = Number(html.find("#num")[0].value);
                    let newPP = Math.max(ppv - number, 0);
                    if (ppv - number < 0) {
                        ui.notifications.notify(game.i18n.localize("BRSW.InsufficientPP"))
                    }
                    else if (arcaneDevice === true) {
                        const updates = [
                            { _id: item.id, "data.additionalStats.devicePP.value": `${newPP}` },
                          ];
                          // Updating the Arcane Device:
                          actor.updateEmbeddedDocuments("Item", updates); 
                    }
                    else {
                        // noinspection JSIgnoredPromiseFromCall
                        if (otherArcane === true) {
                            // Specific power points
                            data['data.powerPoints.' + item.data.data.arcane + '.value'] = newPP;
                        }
                        else {
                            data['data.powerPoints.value'] = newPP;
                        }
                        actor.update(data);
                    }
                    // noinspection JSIgnoredPromiseFromCall
                    ChatMessage.create({
                        speaker: {
                            alias: actor.name
                        },
                        content: game.i18n.format('BRSW.ExpendPPText', {name: actor.name, number: number, newPP: newPP})
                    })
                    //Hooks.call("BRSW-ManualPPManagement", actor, item);
                }
            },
            two: {
                label: game.i18n.localize("BRSW.RechargePP"),
                callback: (html) => {
                    //Button 2: Recharge Power Points (uses a number given that increases the data.powerPoints.value a like amount but does not increase it above the number given in data.powerPoints.max (number field))
                    let number = Number(html.find("#num")[0].value);
                    let newPP = ppv + number
                    if (newPP > ppm) {
                        newPP = ppm;
                        // noinspection JSIgnoredPromiseFromCall
                        if (arcaneDevice === true) {
                            const updates = [
                                { _id: item.id, "data.additionalStats.devicePP.value": `${newPP}` },
                              ];
                              // Updating the Arcane Device:
                              actor.updateEmbeddedDocuments("Item", updates); 
                        }
                        else {
                            if (otherArcane === true) {
                                // Specific power points
                                data['data.powerPoints.' + item.data.data.arcane + '.value'] = newPP;
                            }
                            else {
                                data['data.powerPoints.value'] = newPP;
                            }
                            actor.update(data);
                        }
                        // Declaring variables to reflect hitting the maximum
                        let rechargedPP = ppm - ppv;
                        ChatMessage.create({
                            speaker: {
                                alias: name
                            },
                            content: game.i18n.format("BRSW.RechargePPTextHitMax", {name: actor.name, rechargedPP: rechargedPP, ppm: ppm})
                        })
                        Hooks.call("BRSW-ManualPPManagement", actor, item);
                    }
                    else {
                        if (arcaneDevice === true) {
                            const updates = [
                                { _id: item.id, "data.additionalStats.devicePP.value": `${newPP}` },
                              ];
                              // Updating the Arcane Device:
                              actor.updateEmbeddedDocuments("Item", updates); 
                        }
                        else {
                            if (otherArcane === true) {
                                // Specific power points
                                data['data.powerPoints.' + item.data.data.arcane + '.value'] = newPP;
                            }
                            else {
                                data['data.powerPoints.value'] = newPP;
                            }
                            actor.update(data);
                        }
                        ChatMessage.create({
                            speaker: {
                                alias: name
                            },
                            content: game.i18n.format("BRSW.RechargePPText", {name: actor.name, number: number, newPP: newPP})
                        })
                        Hooks.call("BRSW-ManualPPManagement", actor, item);
                    }
                }
            },
            three: {
                label: game.i18n.localize("BRSW.PPBeniRecharge"),
                callback: () => {
                    //Button 3: Benny Recharge (spends a benny and increases the data.powerPoints.value by 5 but does not increase it above the number given in data.powerPoints.max)
                    if (actor.data.data.bennies.value < 1) {
                        ui.notifications.notify(game.i18n.localize("BRSW.NoBennies"));
                    }
                    else {
                        let newPP = Math.min(ppv + 5, ppm);
                        if (arcaneDevice === true) {
                            const updates = [
                                { _id: item.id, "data.additionalStats.devicePP.value": `${newPP}` },
                              ];
                              // Updating the Arcane Device:
                              actor.updateEmbeddedDocuments("Item", updates); 
                        }
                        else {
                            if (otherArcane === true) {
                                // Specific power points
                                data['data.powerPoints.' + item.data.data.arcane + '.value'] = newPP;
                            }
                            else {
                                data['data.powerPoints.value'] = newPP;
                            }
                            actor.update(data);
                        }
                        actor.spendBenny();
                        if (newPP === ppm) {
                            ChatMessage.create({
                                speaker: {
                                    alias: name
                                },
                                content: game.i18n.format("BRSW.RechargePPBennyTextHitMax", {name: actor.name, ppm: ppm})
                            })
                        }
                        else {
                            ChatMessage.create({
                                speaker: {
                                    alias: name
                                },
                                content: game.i18n.format("BRSW.RechargePPBennyText", {name: actor.name, newPP: newPP})
                            })
                        }
                        Hooks.call("BRSW-ManualPPManagement", actor, item);
                    }
                }
            },
            four: {
                label: game.i18n.localize("BRSW.SoulDrain"),
                callback: () => {
                    //Button 4: Soul Drain (increases data.fatigue.value by 1 and increases the data.powerPoints.value by 5 but does not increase it above the number given in data.powerPoints.max)
                    let newFV = fv + 1
                    if (arcaneDevice === true) {
                        ui.notifications.notify("You cannot use Soul Drain to recharge Arcane Devices.")
                    }
                    else if (newFV > fm) {
                        ui.notifications.notify("You cannot exceed your maximum Fatigue using Soul Drain.")
                    }
                    else {
                        let newPP = ppv + 5
                        if (otherArcane === true) {
                            // Specific power points
                            data['data.powerPoints.' + item.data.data.arcane + '.value'] = newPP;
                        }
                        else {
                            data['data.powerPoints.value'] = newPP;
                        }
                        actor.update(data)
                        actor.update({"data.fatigue.value": fv + 1})
                        ChatMessage.create({
                            speaker: {
                                alias: name
                            },
                            content: game.i18n.format("BRSW.RechargePPSoulDrainText", {name: actor.name, newPP: newPP})
                        })
                        Hooks.call("BRSW-ManualPPManagement", actor, item);
                    }
                },
            }
        }
    }).render(true)
}

/**
 * Gets a template name from an item description
 * @param {Item} item
 */
function get_template_from_description(item){
    if (!TEMPLATE_CLASS) {return }
    const TEMPLATE_KEYS = {
        cone: ['BRSW.Cone', 'cone'],
        sbt: ['BRSW.SmallTemplate', 'sbt', 'small blast'],
        mbt: ['BRSW.MediumTemplate', 'mbt', 'medium blast'],
        lbt: ['BRSW.LargeTemplate', 'lbt', 'large blast']
    }
    if (item.type !== 'weapon' && item.type !== "power") {return}
    let templates_found = []
    for (let template_key in TEMPLATE_KEYS) {
        for (let key_text of TEMPLATE_KEYS[template_key]) {
            let translated_key_text = key_text
            if (key_text.slice(0,4) === 'BRSW') {
                translated_key_text = game.i18n.localize(key_text)
            }
            if (item.data.data?.description?.toLowerCase().includes(translated_key_text) || // jshint ignore:line
                    item.data.data?.range?.toLowerCase().includes(translated_key_text)) { // jshint ignore:line
                templates_found.push(template_key)
                break
            }
        }
    }
    return templates_found
}

