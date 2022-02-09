// Functions for cards representing skills
/* globals TokenDocument, Token, game, CONST, canvas, console, Ray */
// noinspection JSCheckFunctionSignatures

import {
    BRSW_CONST,
    BRWSRoll,
    create_common_card,
    get_action_from_click,
    get_actor_from_ids,
    get_actor_from_message,
    roll_trait,
    spend_bennie,
    trait_to_string,
    create_modifier, process_common_actions, apply_status
} from "./cards_common.js";
import {create_actions_array, get_global_action_from_name} from "./global_actions.js";
import {run_macros} from "./item_card.js";

export const FIGHTING_SKILLS = ["fighting", "kämpfen", "pelear", "combat",
    "lutar", "combattere"];
export const SHOOTING_SKILLS = ["shooting", "schiessen", "disparar", "tir",
    "atirar", "sparare"];
export const THROWING_SKILLS = ["athletics", "athletik", "atletismo", "athletisme",
    "athlétisme", "★ athletics", "atletica"];

/**
* Creates a chat card for a skill
*
* @param {Token, SwadeActor} origin  The actor or token owning the attribute
* @param {string} skill_id The id of the skill that we want to show
* @param {boolean} collapse_actions
* @return A promise for the ChatMessage object
*/
async function create_skill_card(origin, skill_id, collapse_actions) {
    let actor;
    if (origin instanceof TokenDocument || origin instanceof Token) {
        actor = origin.actor;
    } else {
        actor = origin;
    }
    collapse_actions = collapse_actions ||
        game.settings.get('betterrolls-swade2', 'collapse-modifiers')
    const skill = actor.items.find(item => {return item.id === skill_id});
    const extra_name = skill.name + ' ' + trait_to_string(skill.data.data)
    const footer = [game.i18n.localize('BRSW.Attribute') + ": " + skill.data.data.attribute]
    let trait_roll = new BRWSRoll();
    let actions = create_actions_array({}, skill, actor);
    let message = await create_common_card(origin, {header:
                {type: game.i18n.localize("ITEM.TypeSkill"),
                    title: extra_name, img: skill.img},
            footer: footer, trait_roll: trait_roll, trait_id: skill.id,
            action_groups: actions[0], extra_text: actions[1],
            actions_collapsed: collapse_actions},
        CONST.CHAT_MESSAGE_TYPES.ROLL,
        "modules/betterrolls-swade2/templates/skill_card.html")
    await message.setFlag('betterrolls-swade2', 'card_type',
        BRSW_CONST.TYPE_SKILL_CARD)
    return message;
}


/**
* Creates a skill card from a token or actor id, mainly for use in macros
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
    return create_skill_card(actor, skill_id,
        game.settings.get('betterrolls-swade2', 'collapse-modifiers'));
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
    if (action === 'system') {return}
    ev.stopImmediatePropagation();
    ev.preventDefault();
    ev.stopPropagation();
    // First term for PC, second one for NPCs
    const skill_id = ev.currentTarget.parentElement.parentElement.dataset.itemId ||
        ev.currentTarget.parentElement.dataset.itemId
    // Show card
    let message = await create_skill_card(
        target, skill_id, action.includes('trait'));
    if (action.includes('trait')) {
        await roll_skill(message, $(message.data.content), false)
    }
}


/**
 * Activates the listeners in the character sheet for skills
 * @param app: Sheet app
 * @param html: Html code
 */
export function activate_skill_listeners(app, html) {
    let target = app.token?app.token:app.object;
    const skill_labels = html.find('.skill-label a, .skill.item>a, .skill-name, .skill-die');
    skill_labels.bindFirst('click', async ev => {
        await skill_click_listener(ev, target);
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
        const render_data = message.getFlag('betterrolls-swade2', 'render_data')
        const actor = get_actor_from_message(message);
        const item = actor.items.get(render_data.trait_id);
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
    const render_data = message.getFlag('betterrolls-swade2', 'render_data')
    const actor = get_actor_from_message(message)
    const skill = actor.items.find((item) => item.id === render_data.trait_id);
    let extra_data = {}
    let pinned_actions = []
    let macros = [];
    // Actions
    if (html) {
        html.find('.brsw-action.brws-selected').each((_, element) => {
            // noinspection JSUnresolvedVariable
            let action;
            action = get_global_action_from_name(element.dataset.action_id);
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
    for (let group in render_data.action_groups) {
        for (let action of render_data.action_groups[group].actions) {
            // Global and local actions are different
            action.pinned = pinned_actions.includes(action.code) ||
                pinned_actions.includes(action.name)
        }
    }
    if (expend_bennie) {await spend_bennie(actor);}
    await roll_trait(message, skill.data.data , game.i18n.localize(
        "BRSW.SkillDie"), html, extra_data);
    await run_macros(macros, actor, null, message);
}

/***
 * Checks if a skill is fighting, likely not the best way
 *
 * @param skill
 * @return {boolean}
 */
export function is_skill_fighting(skill) {
    let fighting_names = FIGHTING_SKILLS;
    fighting_names.push(game.settings.get('swade', 'parryBaseSkill').toLowerCase());
    return fighting_names.includes(skill.name.toLowerCase());
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
 * @param {Item} item
 */
export function get_tn_from_token(skill, target_token, origin_token, item) {
    let tn = {reason: game.i18n.localize("BRSW.Default"), value: 4,
        modifiers:[]};
    let use_parry_as_tn = false;
    if (is_skill_fighting(skill)) {
        use_parry_as_tn = true;
        const gangup_bonus = calculate_gangUp(origin_token, target_token)
        if (gangup_bonus) {
            tn.modifiers.push(create_modifier(
                game.i18n.localize("BRSW.Gangup"), gangup_bonus));
        }
    } else if (is_shooting_skill(skill) || is_throwing_skill(skill)) {
        const grid_unit = canvas.grid.grid.options.dimensions.distance
        let distance = canvas.grid.measureDistance(
            origin_token, target_token);
        if (distance < grid_unit * 2) {
            use_parry_as_tn = true;
        } else if (item) {
            const range = item.data.data.range.split('/')
            if (grid_unit % 5 === 0) {
                distance = distance / 5;
            }
            if (origin_token.data.elevation !== target_token.data.elevation) {
                let h_diff = Math.abs(
                    origin_token.data.elevation - target_token.data.elevation)
                distance = Math.sqrt(Math.pow(h_diff, 2) + Math.pow(distance, 2));
            }
            let distance_penalty = 0;
            for (let i=0; i<3 && i<range.length; i++) {
                let range_int = parseInt(range[i])
                if (range_int && range_int < distance) {
                    distance_penalty = i < 2 ? (i + 1) * 2 : 8;
                }
            }
            if (distance_penalty) {
                tn.modifiers.push(create_modifier(
                    game.i18n.localize("BRSW.Range") + " " +
                            distance.toFixed(2),
                     - distance_penalty))
            }
        }
    }
    if (use_parry_as_tn) {
        if (target_token.actor.data.type !== "vehicle") {
            tn.reason = `${game.i18n.localize("SWADE.Parry")} - ${target_token.name}`;
            tn.value = parseInt(target_token.actor.data.data.stats.parry.value);
            const parry_mod = parseInt(target_token.actor.data.data.stats.parry.modifier);
            if (parry_mod) {
                tn.value += parry_mod;
            }
        }
        else {
            tn.reason = `Veh - ${target_token.name}`;
            //lookup the vehicle operator and get their maneuveringSkill
            let operator_skill;
            let target_operator_id = target_token.actor.data.data.driver.id.slice(6);
            let target_operator = game.actors.get(target_operator_id);
            let operatorItems = target_operator.data.items;
            const maneuveringSkill = target_token.actor.data.data.driver.skill;
            operatorItems.forEach((value) => {
                if (value.data.name === maneuveringSkill) {
                  operator_skill = value.data.data.die.sides;
                }
            });
            if (operator_skill === null) {
            operator_skill = 0;
            }
            tn.value = operator_skill / 2 + 2 + target_token.actor.data.data.handling;
        }
    }
    // Size modifiers
    if (origin_token && target_token) {
        const origin_scale_mod = sizeToScale(origin_token?.actor?.data?.data?.stats?.size || 1);
        const target_scale_mod = sizeToScale(target_token?.actor?.data?.data?.size || // Vehicles
            target_token?.actor?.data?.data?.stats?.size || 1); // actor or default
        if (origin_scale_mod !== target_scale_mod) {
            tn.modifiers.push(create_modifier(
                game.i18n.localize("BRSW.Scale"), target_scale_mod - origin_scale_mod))
        }
    }
    // noinspection JSUnresolvedVariable
    if (target_token.actor.data.data.status.isVulnerable ||
            target_token.actor.data.data.status.isStunned) {
        tn.modifiers.push(create_modifier(
            `${target_token.name}: ${game.i18n.localize('SWADE.Vuln')}`,2));
    }
    return tn;
}

/**
 * Get the size modifier from size
 *
 * @param {int} size
 **/

function sizeToScale(size) { //p179 swade core
    if (size === -4) {
        return -6;
    } else if (size === -3) {
        return -4;
    } else if (size === -2) {
        return -2;
    } else if (size >= -1 && size <= 3) {
        return 0;
    } else if (size >= 4 && size <= 7) {
        return 2;
    } else if (size >= 8 && size <= 11) {
        return 4;
    } else if (size >= 12) {
        return 6;
    }
}


/**
 *  Calculates gangup modifier, by Bruno Calado
 * @param {Token }attacker
 * @param {Token }target
 * @return {number} modifier
 * pg 101 swade core
 * - Each additional adjacent foe (who isn’t Stunned)
 * - adds +1 to all the attackers’ Fighting rolls, up to a maximum of +4.
 * - Each ally adjacent to the defender cancels out one point of Gang Up bonus from an attacker adjacent to both.
 */
function calculate_gangUp(attacker, target) {
    if (game.settings.get('betterrolls-swade2', 'disable-gang-up')) {return 0}
    if (!attacker || !target) {
        console.log("BetterRolls 2: Trying to calculate gangup with no token", attacker, target)
        return 0;
    }
    if (attacker.data.disposition === target.data.disposition) {return 0;}
    let enemies = 0;
    let allies = 0;
    if(attacker.data.disposition === 1 || attacker.data.disposition === -1) {
        const ITEM_RANGE = 1; // dist 1''
        let allies_within_range_of_target;
        let allies_with_formation_fighter;
        let enemies_within_range_of_target;
        let enemies_within_range_both_attacker_target;
        // disposition -1 means NPC (hostile) is attacking PCs (friendly)
        // disposition 1 PCs (friendly) is attacking NPC (hostile)
        allies_within_range_of_target = canvas.tokens.placeables.filter(t =>
            t.id !== attacker.id &&
                t.data.disposition === attacker.data.disposition &&
                t?.actor?.data.data.status.isStunned === false &&
                t.visible &&
                withinRange(target, t, ITEM_RANGE) &&
                !t.combatant?.data.defeated
        );
        enemies_within_range_of_target = canvas.tokens.placeables.filter(t =>
            t.id !== target.id &&
                t.data.disposition === attacker.data.disposition * -1 &&
                t?.actor?.data.data.status.isStunned === false &&
                withinRange(target, t, ITEM_RANGE) &&
                !t.combatant?.data.defeated
        );
        //alliedWithinRangeOfTargetAndAttacker intersection with attacker and target
        enemies_within_range_both_attacker_target = enemies_within_range_of_target.filter(t =>
            t.data.disposition === attacker.data.disposition * -1 &&
                t?.actor?.data.data.status.isStunned === false &&
                withinRange(attacker, t, ITEM_RANGE) &&
            !t.combatant?.data.defeated
        );
        const formation_fighter_name = game.i18n.localize("BRSW.EdgeName-FormationFighter").toLowerCase();
        allies_with_formation_fighter = allies_within_range_of_target.filter(t =>
            // no need to check for all the things that allies_within_range_of_target
            // is already filtered for
            t.actor?.items.find(item => {return item.data.name.toLowerCase().includes(formation_fighter_name)})
        );
        enemies = allies_within_range_of_target.length + allies_with_formation_fighter.length;
        // allies with formation fighter are counted twice
        allies = enemies_within_range_both_attacker_target.length;
    }
    const reduction = gang_up_reduction(target.actor)
    let modifier = Math.max(0, (enemies - allies - reduction));
    if (target.actor) {
        const improved_block_name = game.i18n.localize(
            "BRSW.EdgeName-ImprovedBlock").toLowerCase()
        const block_name = game.i18n.localize("BRSW.EdgeName-Block").toLowerCase()
        if (target.actor.items.find(item => {return item.data.name.toLowerCase().includes(improved_block_name)})) {
            modifier = Math.max(0, modifier - 2)
        } else if (target.actor.items.find(item => {return item.data.name.toLowerCase().includes(block_name)})) {
            modifier = Math.max(0, modifier - 1)
        }
    }
    return Math.min(4, modifier);
}

/**
 * Gets the gangup reduction from an actor (using a custom AE
 * @param {Actor} target
 */
function gang_up_reduction(target) {
    let reduction = 0
    for (let effect of target.effects) {
        if (!effect.data.disabled) {
            for (let change of effect.changes) {
                if (change.key === 'brsw-ac.gangup-reduction') {
                    reduction += parseInt(change.value) ? change.value : 0
                }
            }
        }
    }
    return reduction
}

// function from Kekilla
function withinRange(origin, target, range) {
    const ray = new Ray(origin, target);
    const grid_unit = canvas.grid.grid.options.dimensions.distance
    let distance = canvas.grid.measureDistances([{ ray }], {gridSpaces: true})[0];
    distance = distance / grid_unit
    return range >= distance;
}
