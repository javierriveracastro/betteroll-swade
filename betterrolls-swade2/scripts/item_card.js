// Functions for cards representing all items but skills
// noinspection JSCheckFunctionSignatures

import {
    BRSW_CONST,
    BRWSRoll,
    calculate_results,
    check_and_roll_conviction,
    create_common_card,
    get_action_from_click,
    get_actor_from_message,
    get_roll_options,
    roll_trait,
    spend_bennie,
    trait_to_string,
    update_message,
    has_joker
} from "./cards_common.js";
import {FIGHTING_SKILLS, SHOOTING_SKILLS, THROWING_SKILLS} from "./skill_card.js"
import {get_targeted_token, makeExplotable} from "./utils.js";
import {create_damage_card} from "./damage_card.js";
import {get_actions, get_global_action_from_name} from "./global_actions.js";


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
    "non entraine", "non entrainé"];

const ROF_BULLETS = {1: 1, 2: 5, 3: 10, 4: 20, 5: 40, 6: 50}

/**
* Creates a chat card for an item
*
* @param {Token, SwadeActor} origin  The actor or token owning the attribute
* @param {string} item_id The id of the item that we want to show
* @param {boolean} collapse_actions True if the action selector should start collapsed
* @return A promise for the ChatMessage object
*/
async function create_item_card(origin, item_id, collapse_actions) {
    const actor = origin.hasOwnProperty('actor')?origin.actor:origin;
    const item = actor.items.find(item => {return item.id === item_id});
    let footer = make_item_footer(item);
    const skill = get_item_skill(item, actor);
    const skill_title = skill ? skill.name + ' ' +
        trait_to_string(skill.data.data) : '';
    const notes = item.data.data.notes || (skill === undefined ? item.name : skill.name);
    let trait_roll = new BRWSRoll();
    let actions = [];
    let possible_default_dmg_action;
    // noinspection JSUnresolvedVariable
    for (let action in item.data.data?.actions?.additional) {
        // noinspection JSUnresolvedVariable
        if (item.data.data.actions.additional.hasOwnProperty(action)) {
            // noinspection JSUnresolvedVariable
            const has_skill_mod =
                !!(item.data.data.actions.additional[action].skillMod ||
                    item.data.data.actions.additional[action].skillOverride);
            const has_dmg_mod =
                !!item.data.data.actions.additional[action].dmgMod;
            actions.push(
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
    let ammo = parseFloat(item.data.data.shots);
    let power_points = parseFloat(item.data.data.pp);
    const subtract_select = ammo ? game.settings.get(
        'betterrolls-swade2', 'default-ammo-management') : false;
    const subtract_pp_select =  power_points ? game.settings.get(
        'betterrolls-swade2', 'default-pp-management') : false;
    let damage = item.data.data.damage;
    if (!damage && possible_default_dmg_action) {
        damage = possible_default_dmg_action;
    }
    get_actions(item, actor).forEach(global_action => {
        const has_skill_mod = !!global_action.skillMod;
        const has_dmg_mod = !!global_action.dmgMod;
        const button_name = global_action.button_name.slice(0, 5) === "BRSW." ?
            game.i18n.localize(global_action.button_name) : global_action.button_name;
        actions.push(
            {code: global_action.name, name: button_name, pinned: false,
                damage_icon: has_dmg_mod, skill_icon: has_skill_mod});
    })
    let message = await create_common_card(origin,
        {header: {type: 'Item', title: item.name,
            img: item.img}, notes: notes,  footer: footer, damage: damage,
            skill: skill, skill_title: skill_title, ammo: ammo,
            subtract_selected: subtract_select, subtract_pp: subtract_pp_select,
            trait_roll: trait_roll, damage_rolls: [],
            powerpoints: power_points, actions: actions,
            actions_collapsed: collapse_actions},
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
    return create_item_card(origin, skill_id);
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
    const collapse_actions = action.includes('trait') || action.includes('damage');
    // Show card
    let message = await create_item_card(target, item_id, collapse_actions);
    // Shortcut for rolling damage
    if (ev.currentTarget.classList.contains('damage-roll')) {
        await roll_dmg(message, '', false, false);
    }
    if (action.includes('trait')) {
        await roll_item(message, '', false,
            action.includes('damage'));
    }
}


/**
 * Activates the listeners in the character sheet in items
 * @param app: Sheet app
 * @param html: Html code
 */
export function activate_item_listeners(app, html) {
    let target = app.token?app.token:app.object;
    const item_images = html.find('.item-image, .item-img, .name.item-show, span.item>.item-control.item-edit, .gear-card>.card-header>.item-name, .damage-roll, .item-name>h4, .power-header>.item-name');
    item_images.bindFirst('click', async ev => {
        await item_click_listener(ev, target);
    });
    let item_li = html.find('.gear-card.item, .item.flexrow, .power.item')
    item_li.attr('draggable', 'true');
    item_li.bindFirst('dragstart',async ev => {
        const item_id = ev.currentTarget.dataset.itemId;
        const token_id = app.token ? app.token.id : '';
        const actor_id = app.object ? app.object.id : '';
        let actor = game.actors.get(actor_id);
        let item = actor.getOwnedItem(item_id);
        if (!actor || !item) {
            // Fallback to token
           actor = canvas.tokens.get(token_id);
           item = actor.actor.getOwnedItem(item_id);
        }
        const macro_data = {name: `${actor.name}: ${item.name}`, img: item.img,
            type: "script", scope: "global"};
        macro_data.command =
            `game.brsw.create_item_card_from_id('${token_id}', '${actor_id}', '${item_id}').then(
             message => {game.brsw.roll_item(message, "", false)});`;
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
    const actor = get_actor_from_message(message);
    const item = actor.getOwnedItem(message.getFlag(
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
        manual_pp(actor);
    });
   html.find('.brsw-apply-damage').click((ev) => {
       create_damage_card(ev.currentTarget.dataset.token,
           ev.currentTarget.dataset.damage,
           `${actor.name} - ${item.name}`);
   });
   html.find('.brsw-target-tough').click(ev => {
      edit_tougness(message, ev.currentTarget.dataset.index);
   });
   html.find('.brsw-add-damage-d6').click(ev => {
       add_damage_dice(message, ev.currentTarget.dataset.index);
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
                locations += armor_location;
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
 * Guess the skill that should be rolled for an item
 * @param {Item} item The item.
 * @param {SwadeActor} actor The owner of the iem
 */
export function get_item_skill(item, actor) {
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



/**
 * Get an skill from an actor and the skill name
 * @param {SwadeActor} actor Where search for the skill
 * @param {string} skill_name
 */
function skill_from_string(actor, skill_name) {
    let skill = actor.items.find(skill => {
        return skill.name.toLowerCase().replace('★ ', '') ===
            skill_name.toLowerCase().replace('★ ', '')
            && skill.type === 'skill';
    });
    if (!skill) {
        // No skill was found, we try to find untrained
        skill = check_skill_in_actor(actor, UNTRAINED_SKILLS);
    }
    return skill;
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


/**
 * Discount ammo from an item
 *
 * @param item Item that has ben shoot
 * @param rof Rof of the shot
 * @param {int} shot_override
 */
async function discount_ammo(item, rof, shot_override) {
    // noinspection JSUnresolvedVariable
    const ammo = parseInt(item.data.data.currentShots);
    const ammo_spent = shot_override >= 0 ? shot_override : ROF_BULLETS[rof];
    const final_ammo = Math.max(ammo - ammo_spent, 0)
    // noinspection JSUnresolvedVariable
    let content = `<p>${ammo_spent} shot has been expended from ${item.name}. There are ${final_ammo} shots remaining</p>`
    if (ammo_spent > ammo) {
        content = '<p class="brsw-fumble-row">Not enough ammo!</p>' + content;
    }
    await item.update({'data.currentShots': final_ammo});
    await ChatMessage.create({content: content});
}

/**
 * Discount pps from an actor
 *
 * @param {SwadeActor }actor
 * @param item
 * @param {Roll[]} rolls
 */
async function discount_pp(actor, item, rolls) {
    let success = false;
    for (let roll of rolls) {
        if (roll.result >= 4) {
            success = true
        }
    }
    const pp = success ? parseInt(item.data.data.pp) : 1;
    // noinspection JSUnresolvedVariable
    const current_pp = actor.data.data.powerPoints.value;
    const final_pp = Math.max(current_pp - pp, 0);
    let content = game.i18n.format("BRSW.ExpendedPoints",
        {name: actor.name, final_pp: final_pp, pp: pp});
    if (current_pp < pp) {
        content = game.i18n.localize("BRSW.NotEnoughPP") +  content;
    }
    await actor.update({'data.powerPoints.value': final_pp});
    await ChatMessage.create({
        content: content
    });
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
    const actor = get_actor_from_message(message)
    const item_id = message.getFlag('betterrolls-swade2', 'item_id');
    const item = actor.items.find((item) => item.id === item_id);
    let skill = get_item_skill(item, actor);
    let shots_override = -1;  // Override the number of shots used
    let extra_data = {skill: skill};
    if (expend_bennie) await spend_bennie(actor);
    extra_data.rof = item.data.data.rof || 1;
    let pinned_actions = []
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
            if (action.rof) {
                extra_data.rof = action.rof;
            }
            // noinspection JSUnresolvedVariable
            if (action.skillMod) {
                let modifier = {name: action.name, value: parseInt(action.skillMod)};
                if (extra_data.modifiers) {
                    extra_data.modifiers.push(modifier);
                } else {
                    extra_data.modifiers = [modifier];
                }
            }
            // noinspection JSUnresolvedVariable
            if (action.skillOverride) {
                skill = skill_from_string(actor, action.skillOverride);
            }
            // noinspection JSUnresolvedVariable
            if (action.shotsUsed) {
                shots_override = parseInt(action.shotsUsed);
            }
            if (action.self_add_status) {
                let new_state = {};
                new_state[`data.status.is${action.self_add_status}`] = true
                actor.update(new_state)
            }
            if (element.classList.contains("brws-permanent-selected")) {
                pinned_actions.push(action.name);
            }
        });
    }
    // Check rof if avaliable
    const trait_data = await roll_trait(message, skill.data.data , game.i18n.localize(
        "BRSW.SkillDie"), html, extra_data)
    let render_data = await message.getFlag('betterrolls-swade2', 'render_data');
    // Pinned actions
    // noinspection JSUnresolvedVariable
    render_data.actions.forEach(action => {
        // Global and local actions are different
        action.pinned = pinned_actions.includes(action.code) ||
            pinned_actions.includes(action.name)
    });
    // Ammo management
    const dis_ammo_selected = html ? html.find('.brws-selected.brsw-ammo-toggle').length :
        game.settings.get('betterrolls-swade2', 'default-ammo-management');
    if (dis_ammo_selected && parseInt(item.data.data.shots) && !trait_data.old_rolls.length) {
        let rof = trait_data.dice.length;
        if (actor.isWildcard) {
            rof -= 1;
        }
        await discount_ammo(item, rof || 1, shots_override);
    }
    // Power point management
    const pp_selected = html ? html.find('.brws-selected.brsw-pp-toggle').length :
        game.settings.get('betterrolls-swade2', 'default-pp-management');
    if (parseInt(item.data.data.pp) && pp_selected && !trait_data.old_rolls.length) {
        await discount_pp(actor, item, trait_data.rolls);
    }
    await update_message(message, actor, render_data);
    //Call a hook after roll for other modules
    Hooks.call("BRSW-RollItem", message, html );
    if (roll_damage) {
        trait_data.rolls.forEach(roll => {
            if (roll.result >= roll.tn && roll.tn > 0) {
                roll_dmg(message, html, false, {},
                    roll.result > roll.tn + 3)
            }
        });
    }
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
                        // noinspection JSIgnoredPromiseFromCall
                        actor.updateOwnedItem(updates);
                        // noinspection JSIgnoredPromiseFromCall
                        actor.updateOwnedItem(updates);
                        // noinspection JSIgnoredPromiseFromCall
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
                    // If the quantity of ammo is less than the amount required, use whatever is left.
                    let item = actor.getOwnedItem(weapon.id);
                    let ammo = actor.items.find(possible_ammo => {
                        return possible_ammo.name === item.data.data.ammo
                    })
                    let ammo_quantity = 999999999;
                    if (ammo) {
                        ammo_quantity = ammo.data.data.quantity;
                    }
                    let number = Number(html.find("#num")[0].value);
                    let max_ammo = parseInt(weapon.data.data.shots);
                    // noinspection JSUnresolvedVariable
                    let current_ammo = parseInt(weapon.data.data.currentShots);
                    let newCharges =  Math.min(max_ammo, current_ammo + number,
                        current_ammo + ammo_quantity);
                    let updates = [{_id: weapon.id, "data.currentShots": `${newCharges}`}];
                    if (ammo) {
                        // noinspection JSCheckFunctionSignatures
                        updates.push({_id: ammo.id, "data.quantity": ammo.data.data.quantity - newCharges + current_ammo});
                    }
                    // noinspection JSIgnoredPromiseFromCall
                    actor.updateOwnedItem(updates);
                    // noinspection JSIgnoredPromiseFromCall
                    ChatMessage.create({
                        speaker: {
                            alias: actor.name
                        },
                        content: `<img src=${weapon.img} alt="${weapon.name}" style="height: 2em;"><p>${game.i18n.format(
                            "BRSW.ReloadStatus", {actor_name: actor.name, weapon_name:weapon.name})}</p>`
                    })
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
 */
function get_tougness_targeted_selected(acting_actor) {
    let objetive = get_targeted_token();
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
    if (objetive) {
        defense_values.toughness = parseInt(
              objetive.actor.data.data.stats.toughness.value);
        defense_values.armor = parseInt(
              objetive.actor.data.data.stats.toughness.armor);
        defense_values.name = objetive.name;
        defense_values.token_id = objetive.id;
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
    let render_data = message.getFlag('betterrolls-swade2', 'render_data');
    const actor = get_actor_from_message(message)
    const item_id = message.getFlag('betterrolls-swade2', 'item_id');
    const item = actor.items.find((item) => item.id === item_id);
    if (expend_bennie) await spend_bennie(actor);
    let total_modifiers = 0;
    // Calculate modifiers
    let options = get_roll_options(html, default_options);
    let roll_formula = item.data.data.damage;
    // Betterrolls modifiers
    let damage_roll = {label: '---', brswroll: new BRWSRoll(), raise:raise};
    options.dmgMods.forEach(mod => {
        const mod_value = parseInt(mod);
        damage_roll.brswroll.modifiers.push({name: 'Better Rolls', value: mod_value, extra_class: ''});
        total_modifiers += mod_value;
    })
    // Action mods
    // noinspection JSUnresolvedVariable
    if (item.data.data.actions.dmgMod) {
        // noinspection JSUnresolvedVariable
        const mod_value = parseInt(item.data.data.actions.dmgMod);
        damage_roll.brswroll.modifiers.push({
            name: game.i18n.localize("BRSW.ItemMod"),
            value: mod_value
        });
        total_modifiers += mod_value
    }
    // Joker
    if (has_joker(message.getFlag('betterrolls-swade2', 'token'))) {
        damage_roll.brswroll.modifiers.push({name: 'Joker', value: 2});
        total_modifiers += 2;
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
            const intDmgMod = parseInt(action.dmgMod)
            if (intDmgMod) {
                damage_roll.brswroll.modifiers.push(
                    {name: action.name, value: intDmgMod});
                total_modifiers += intDmgMod
            }
            if (action.dmgOverride) {
                roll_formula = action.dmgOverride;
            }
            if (action.self_add_status) {
                let new_state = {};
                new_state[`data.status.is${action.self_add_status}`] = true
                actor.update(new_state)
            }
            if (element.classList.contains("brws-permanent-selected")) {
                pinned_actions.push(action.name);
            }
        });
    }
    if (!roll_formula) {
        // Damage is empty and damage action has been selected...
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
    let roll = new Roll(raise ? formula + "+1d6x" : formula,
        actor.getRollShortcuts());
    roll.evaluate();
    const defense_values = get_tougness_targeted_selected(actor);
    damage_roll.brswroll.rolls.push(
        {result: roll.total + total_modifiers, tn: defense_values.toughness,
        armor: defense_values.armor, ap: parseInt(item.data.data.ap) || 0,
        target_id: defense_values.token_id || 0});
    let last_string_term = ''
    roll.terms.forEach(term => {
        if (term.hasOwnProperty('faces')) {
            let new_die = {faces: term.faces, results: [],
                extra_class: '',
                label: game.i18n.localize("SWADE.Dmg") + `(${formula})`};
            if (term.total > term.faces) {
                new_die.extra_class = ' brsw-blue-text';
                if (!damage_roll.brswroll.rolls[0].extra_class) {
                    damage_roll.brswroll.rolls[0].extra_class = ' brsw-blue-text';
                }
            }
            term.results.forEach(result => {
                new_die.results.push(result.result);
            })
            damage_roll.brswroll.dice.push(new_die);
        } else {
            if (parseInt(term)) {
                let modifier_value = parseInt(last_string_term + term);
                if (modifier_value) {
                    damage_roll.brswroll.modifiers.push({'value': modifier_value,
                        'name': game.i18n.localize("SWADE.Dmg") + `(${formula})`});
                    total_modifiers += modifier_value;
                }
            }
            last_string_term = term;
        }
    })
    if (raise) {
        // Last die is raise die.
        damage_roll.brswroll.dice[damage_roll.brswroll.dice.length - 1].label =
            game.i18n.localize("BRSW.Raise");
    }
    damage_roll.label = defense_values.name;
    render_data.damage_rolls.push(damage_roll);
    // Pinned actions
    // noinspection JSUnresolvedVariable
    render_data.actions.forEach(action => {
        // Global and local actions are different
        action.pinned = pinned_actions.includes(action.code) ||
            pinned_actions.includes(action.name)
    });
    // Dice so nice
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
        // noinspection ES6MissingAwait
        await game.dice3d.showForRoll(roll, game.user, true, users);
    }
    damage_roll.damage_result = calculate_results(damage_roll.brswroll.rolls, true);
    await update_message(message, actor, render_data);
}


/**
 * Add a d6 to a damage roll
 * @param {ChatMessage} message
 * @param {int }index
 */
function add_damage_dice(message, index) {
    let render_data = message.getFlag('betterrolls-swade2', 'render_data');
    const actor = get_actor_from_message(message);
    let damage_rolls = render_data.damage_rolls[index].brswroll;
    let roll = new Roll("1d6x");
    roll.evaluate();
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
    render_data.damage_rolls[index].damage_result = calculate_results(
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
        // noinspection ES6MissingAwait
        game.dice3d.showForRoll(roll, game.user, true, users);
    }
    // noinspection JSIgnoredPromiseFromCall
    update_message(message, actor, render_data)
}


/**
 * Changes the damage target of one of the rolls.
 *
 * @param {ChatMessage} message
 * @param {int} index:
 */
function edit_tougness(message, index) {
    let render_data = message.getFlag('betterrolls-swade2', 'render_data');
    const actor = get_actor_from_message(message);
    const defense_values = get_tougness_targeted_selected(actor);
    let damage_rolls = render_data.damage_rolls[index].brswroll.rolls;
    damage_rolls[0].tn = defense_values.toughness;
    damage_rolls[0].armor = defense_values.armor;
    damage_rolls[0].target_id = defense_values.token_id || 0;
    render_data.damage_rolls[index].label = defense_values.name;
    render_data.damage_rolls[index].damage_result = calculate_results(
        damage_rolls, true);
    // noinspection JSIgnoredPromiseFromCall
    update_message(message, actor, render_data)
}


/**
 * Function to manually manage power points (c) SalieriC
 * @param {SwadeActor} actor
 */
function manual_pp(actor) {
    // noinspection JSUnresolvedVariable
    const ppv = actor.data.data.powerPoints.value;
    // noinspection JSUnresolvedVariable
    const ppm = actor.data.data.powerPoints.max;
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
                    //Button 1: Spend Power Point(s) (uses a number given that reduces data.powerPoints.value (number field)) but can't be lower than 0.
                    let number = Number(html.find("#num")[0].value);
                    let newPP = Math.max(ppv - number, 0);
                    if (ppv - number < 0) {
                        ui.notifications.notify(game.i18n.localize("BRSW.InsufficientPP"))
                    }
                    else {
                        // noinspection JSIgnoredPromiseFromCall
                        actor.update({ "data.powerPoints.value": newPP });
                    }
                    // noinspection JSIgnoredPromiseFromCall
                    ChatMessage.create({
                        speaker: {
                            alias: actor.name
                        },
                        content: game.i18n.format('BRSW.ExpendPPText', {name: actor.name, number: number, newPP: newPP})
                    })
                }
            },
            two: {
                label: game.i18n.localize("BRSW.RechargePP"),
                callback: (html) => {
                    //Button 2: Recharge Power Points (uses a number given that increases the data.powerPoints.value a like amount but does not increase it above the number given in data.powerPoints.max (number field))
                    let number = Number(html.find("#num")[0].value);
                    let newPP = ppv + number
                    if (newPP > ppm) {
                        // noinspection JSIgnoredPromiseFromCall
                        actor.update({ "data.powerPoints.value": ppm });
                        // Declaring variables to reflect hitting the maximum
                        let rechargedPP = ppm - ppv;
                        ChatMessage.create({
                            speaker: {
                                alias: name
                            },
                            content: game.i18n.format("BRSW.RechargePPTextHitMax", {name: actor.name, rechargedPP: rechargedPP, ppm: ppm})
                        })
                    }
                    else {
                        actor.update({ "data.powerPoints.value": newPP });
                        ChatMessage.create({
                            speaker: {
                                alias: name
                            },
                            content: game.i18n.format("BRSW.RechargePPText", {name: actor.name, number: number, newPP: newPP})
                        })
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
                        actor.update({ "data.powerPoints.value": newPP });
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
                    }
                }
            },
            four: {
                label: game.i18n.localize("BRSW.SoulDrain"),
                callback: () => {
                    //Button 4: Soul Drain (increases data.fatigue.value by 1 and increases the data.powerPoints.value by 5 but does not increase it above the number given in data.powerPoints.max)
                    let newFV = fv + 1
                    if (newFV > fm) {
                        ui.notifications.notify("You cannot exceed your maximum Fatigue using Soul Drain.")
                    }
                    else {
                        let newPP = ppv + 5
                        actor.update(
                            {"data.powerPoints.value": Math.min(newPP, ppm),
                                "data.fatigue.value": fv + 1})
                        ChatMessage.create({
                            speaker: {
                                alias: name
                            },
                            content: `${name} recharges 5 Power Point(s) using Soul Drain and now has <b>${newPP}</b>.`
                        })
                    }
                },
            }
        }
    }).render(true)
}
