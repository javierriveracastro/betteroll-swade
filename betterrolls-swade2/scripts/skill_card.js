// Functions for cards representing skills
/* globals TokenDocument, Token, game, CONST, canvas, console, Ray, succ, $ */
// noinspection JSCheckFunctionSignatures

import {
  BRSW_CONST,
  create_common_card,
  get_action_from_click,
  get_actor_from_ids,
  roll_trait,
  spend_bennie,
  trait_to_string,
  create_modifier,
  process_common_actions,
  BrCommonCard,
} from "./cards_common.js";
import { run_macros } from "./item_card.js";
import { get_enabled_gm_actions } from "./gm_modifiers.js";

// noinspection SpellCheckingInspection
export const FIGHTING_SKILLS = [
  "fighting",
  "kämpfen",
  "pelear",
  "combat",
  "lutar",
  "combattere",
];
// noinspection SpellCheckingInspection
export const SHOOTING_SKILLS = [
  "shooting",
  "schiessen",
  "disparar",
  "tir",
  "atirar",
  "sparare",
];
// noinspection SpellCheckingInspection
export const THROWING_SKILLS = [
  "athletics",
  "athletik",
  "atletismo",
  "athletisme",
  "athlétisme",
  "★ athletics",
  "atletica",
];

/**
 * Creates a chat card for a skill
 *
 * @param {Token, SwadeActor} origin  The actor or token owning the attribute
 * @param {string} skill_id The id of the skill that we want to show
 * @return {Promise} A promise for the ChatMessage object
 */
async function create_skill_card(origin, skill_id) {
  let actor;
  if (origin instanceof TokenDocument || origin instanceof Token) {
    actor = origin.actor;
  } else {
    actor = origin;
  }
  const skill = actor.items.find((item) => {
    return item.id === skill_id;
  });
  const extra_name = skill.name + " " + trait_to_string(skill.system);
  const footer = [
    game.i18n.localize("BRSW.Attribute") + ": " + skill.system.attribute,
  ];
  let br_message = await create_common_card(
    origin,
    {
      header: {
        type: game.i18n.localize("ITEM.TypeSkill"),
        title: extra_name,
        img: skill.img,
      },
      footer: footer,
      trait_id: skill.id,
      description: skill.system.description,
    },
    CONST.CHAT_MESSAGE_TYPES.ROLL,
    "modules/betterrolls-swade2/templates/skill_card.html",
  );
  br_message.type = BRSW_CONST.TYPE_SKILL_CARD;
  br_message.skill_id = skill.id;
  await br_message.render();
  await br_message.save();
  return br_message.message;
}

/**
 * Creates a skill card from a token or actor id, mainly for use in macros
 *
 * @param {string} token_id A token id, if it can be solved it will be used
 *  before actor
 * @param {string} actor_id An actor id, it could be set as fallback or
 *  if you keep token empty as the only way to find the actor
 * @param {string} skill_id Id of the skill item
 * @return {Promise} a promise fot the ChatMessage object
 */
function create_skill_card_from_id(token_id, actor_id, skill_id) {
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
 * @param ev javascript click event
 * @param {SwadeActor, Token} target token or actor from the char sheet
 */
async function skill_click_listener(ev, target) {
  const action = get_action_from_click(ev);
  if (action === "system") {
    return;
  }
  ev.stopImmediatePropagation();
  ev.preventDefault();
  ev.stopPropagation();
  // First term for PC, second one for NPCs
  const skill_id =
    ev.currentTarget.parentElement.parentElement.dataset.itemId ||
    ev.currentTarget.parentElement.dataset.itemId;
  // Show card
  let message = await create_skill_card(target, skill_id);
  if (action.includes("trait")) {
    await roll_skill(message, false);
  }
}

/**
 * Activates the listeners in the character sheet for skills
 * @param app Sheet app
 * @param html Html code
 */
export function activate_skill_listeners(app, html) {
  let target = app.token || app.object;
  const skill_labels = html.find(
    ".skill-label a, .skill.item>a, .skill-name, .skill-die",
  );
  skill_labels.bindFirst("click", async (ev) => {
    await skill_click_listener(ev, target);
  });
}

/**
 * Activate the listeners in the skill card
 * @param message Message date
 * @param html Html produced
 */
export function activate_skill_card_listeners(message, html) {
  html.find(".brsw-roll-button").click(async (ev) => {
    await roll_skill(
      message,
      ev.currentTarget.classList.contains("roll-bennie-button"),
    );
  });
  html.find(".brsw-header-img").click((_) => {
    const br_card = new BrCommonCard(message);
    const { render_data, actor } = br_card;
    const item = actor.items.get(render_data.trait_id);
    item.sheet.render(true);
  });
}

/**
 * Roll a skill showing the roll card and the result card when enables
 *
 * @param {ChatMessage} message
 * @param {boolean} expend_bennie True if we want to spend a bennie
 */
export async function roll_skill(message, expend_bennie) {
  const render_data = message.getFlag("betterrolls-swade2", "render_data");
  let br_card = new BrCommonCard(message);
  const skill = br_card.actor.items.find(
    (item) => item.id === render_data.trait_id,
  );
  let extra_data = { modifiers: [] };
  let macros = [];
  // Actions
  for (let action of br_card.get_selected_actions()) {
    process_common_actions(action.code, extra_data, macros, br_card.actor);
  }
  for (let action of get_enabled_gm_actions()) {
    process_common_actions(action, extra_data, macros, br_card.actor);
  }
  if (expend_bennie) {
    await spend_bennie(br_card.actor);
  }
  await roll_trait(
    br_card,
    skill.system,
    game.i18n.localize("BRSW.SkillDie"),
    extra_data,
  );
  await run_macros(macros, br_card.actor, null, br_card);
}

/***
 * Checks if a skill is fighting, likely not the best way
 *
 * @param skill
 * @return {boolean}
 */
export function is_skill_fighting(skill) {
  let fighting_names = FIGHTING_SKILLS;
  fighting_names.push(
    game.settings.get("swade", "parryBaseSkill").toLowerCase(),
  );
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

/**
 * Calculates de distance between tokens
 * @param origin_token
 * @param target_token
 * @param item
 * @param tn
 * @param {SwadeItem} skill
 * @return {boolean} True if parry should be used as the tn (tokens are adjacent)
 */
export function calculate_distance(
  origin_token,
  target_token,
  item,
  tn,
  skill,
) {
  const grid_unit = canvas.grid.grid.options.dimensions.distance;
  let use_parry_as_tn = false;
  let use_grid_calc = game.settings.get(
    "betterrolls-swade2",
    "range_calc_grid",
  );
  let distance = canvas.grid.measureDistance(
    origin_token.center,
    target_token.center,
    { gridSpaces: use_grid_calc },
  );
  if (distance < grid_unit * 2 && item) {
    use_parry_as_tn = item.type !== "power";
  } else if (item) {
    const range = item.system.range.split("/");
    if (grid_unit % 5 === 0) {
      distance /= 5;
    }
    if (origin_token.document.elevation !== target_token.document.elevation) {
      let h_diff = Math.abs(
        origin_token.document.elevation - target_token.document.elevation,
      );
      distance = Math.sqrt(Math.pow(h_diff, 2) + Math.pow(distance, 2));
    }
    let distance_penalty = 0;
    let rangeEffects;
    if (!is_shooting_skill(skill)) {
      // Throwing skill them
      rangeEffects = origin_token.actor.appliedEffects.find((e) =>
        e.changes.find((ch) => ch.key === "brsw.thrown-range-modifier"),
      );
      if (rangeEffects) {
        if (rangeEffects.disabled) {
          rangeEffects = null;
        } else {
          rangeEffects = rangeEffects.changes.find(
            (ch) => ch.key === "brsw.thrown-range-modifier",
          ).value;
        }
      }
    }
    let extreme_range = 0;
    for (let i = 0; i < 3 && i < range.length; i++) {
      let range_int = parseInt(range[i]);
      if (rangeEffects) {
        range_int += rangeEffects * (i + 1);
      }
      if (range_int && range_int < distance) {
        distance_penalty = i < 2 ? (i + 1) * 2 : 8;
      }
    }
    if (extreme_range && distance > extreme_range * 4) {
      tn.modifiers.push(
        create_modifier(game.i18n.localize("BRSW.OverExtremeRange"), -999),
      );
    }
    if (distance_penalty) {
      tn.modifiers.push(
        create_modifier(
          game.i18n.localize("BRSW.Range") + " " + distance.toFixed(2),
          -distance_penalty,
        ),
      );
    }
  }
  return use_parry_as_tn;
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
  let tn = {
    reason: game.i18n.localize("BRSW.Default"),
    value: 4,
    modifiers: [],
  };
  let use_parry_as_tn = true;
  if (is_skill_fighting(skill)) {
    const gangup_bonus = calculate_gangUp(origin_token, target_token);
    if (gangup_bonus) {
      tn.modifiers.push(
        create_modifier(game.i18n.localize("BRSW.Gangup"), gangup_bonus),
      );
    }
  } else {
    use_parry_as_tn = calculate_distance(
      origin_token,
      target_token,
      item,
      tn,
      skill,
    );
  }
  if (use_parry_as_tn) {
    if (target_token.actor.type !== "vehicle") {
      tn.reason = `${game.i18n.localize("SWADE.Parry")} - ${target_token.name}`;
      tn.value = parseInt(target_token.actor.system.stats.parry.value);
    } else {
      tn.reason = `Veh - ${target_token.name}`;
      //lookup the vehicle operator and get their maneuveringSkill
      let operator_skill;
      let target_operator_id = target_token.actor.system.driver.id.slice(6);
      let target_operator = game.actors.get(target_operator_id);
      let operatorItems = target_operator.data.items;
      const maneuveringSkill = target_token.actor.system.driver.skill;
      operatorItems.forEach((value) => {
        if (value.data.name === maneuveringSkill) {
          operator_skill = value.data.data.die.sides;
        }
      });
      if (operator_skill === null) {
        operator_skill = 0;
      }
      tn.value = operator_skill / 2 + 2 + target_token.actor.system.handling;
    }
  }
  // Size modifiers
  if (origin_token && target_token) {
    const origin_scale_mod = sizeToScale(
      origin_token?.actor?.system?.stats?.size || 1,
    );
    const target_scale_mod = sizeToScale(
      target_token?.actor?.system?.size || // Vehicles
        target_token?.actor?.system?.stats?.size ||
        1,
    ); // actor or default
    if (origin_scale_mod !== target_scale_mod) {
      tn.modifiers.push(
        create_modifier(
          game.i18n.localize("BRSW.Scale"),
          target_scale_mod - origin_scale_mod,
        ),
      );
    }
  }
  // noinspection JSUnresolvedVariable
  if (
    target_token.actor.system.status.isVulnerable ||
    target_token.actor.system.status.isStunned
  ) {
    tn.modifiers.push(
      create_modifier(
        `${target_token.name}: ${game.i18n.localize("SWADE.Vuln")}`,
        2,
      ),
    );
  }
  return tn;
}

/**
 * Get the size modifier from size
 *
 * @param {int} size
 **/

function sizeToScale(size) {
  //p179 swade core
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
  if (game.settings.get("betterrolls-swade2", "disable-gang-up")) {
    return 0;
  }
  if (!attacker || !target) {
    console.log(
      "BetterRolls 2: Trying to calculate gangup with no token",
      attacker,
      target,
    );
    return 0;
  }
  if (attacker.document.disposition === target.document.disposition) {
    return 0;
  }
  let enemies = 0;
  let allies = 0;
  if (
    attacker.document.disposition === 1 ||
    attacker.document.disposition === -1
  ) {
    let item_range = game.settings.get("betterrolls-swade2", "meleeDistance");
    let allies_within_range_of_target;
    let allies_with_formation_fighter;
    let enemies_within_range_of_target;
    let enemies_within_range_both_attacker_target;
    // disposition -1 means NPC (hostile) is attacking PCs (friendly)
    // disposition 1 PCs (friendly) is attacking NPC (hostile)
    allies_within_range_of_target = canvas.tokens.placeables.filter(
      (t) =>
        t.id !== attacker.id &&
        t.document.disposition === attacker.document.disposition &&
        t?.actor?.system.status.isStunned === false &&
        t.visible &&
        withinRange(target, t, item_range) &&
        !t.combatant?.defeated,
    );
    enemies_within_range_of_target = canvas.tokens.placeables.filter(
      (t) =>
        t.id !== target.id &&
        t.document.disposition === attacker.document.disposition * -1 &&
        t?.actor?.system.status.isStunned === false &&
        withinRange(target, t, item_range) &&
        !t.combatant?.defeated,
    );
    //alliedWithinRangeOfTargetAndAttacker intersection with attacker and target
    enemies_within_range_both_attacker_target =
      enemies_within_range_of_target.filter(
        (t) =>
          t.document.disposition === attacker.document.disposition * -1 &&
          t?.actor?.system.status.isStunned === false &&
          withinRange(attacker, t, item_range) &&
          !t.combatant?.defeated,
      );
    const formation_fighter_name = game.i18n
      .localize("BRSW.EdgeName-FormationFighter")
      .toLowerCase();
    allies_with_formation_fighter = allies_within_range_of_target.filter((t) =>
      // no need to check for all the things that allies_within_range_of_target
      // is already filtered for
      t.actor?.items.find((item) => {
        return item.name.toLowerCase().includes(formation_fighter_name);
      }),
    );
    enemies =
      allies_within_range_of_target.length +
      allies_with_formation_fighter.length;
    if (
      enemies > 0 &&
      attacker.actor?.items.find((item) => {
        return item.name.toLowerCase().includes(formation_fighter_name);
      })
    ) {
      enemies += 1;
    }
    // allies with formation fighter are counted twice
    allies = enemies_within_range_both_attacker_target.length;
  }
  const reduction = gang_up_reduction(target.actor);
  const addition = gang_up_addition(attacker.actor);
  let modifier = Math.max(0, enemies - allies - reduction + addition);
  const improved_block_name = game.i18n
    .localize("BRSW.EdgeName-ImprovedBlock")
    .toLowerCase();
  const block_name = game.i18n.localize("BRSW.EdgeName-Block").toLowerCase();
  let findBlock = true;
  let blockEffects = target.actor.appliedEffects.filter((e) =>
    e.name.toLowerCase().includes(block_name),
  );
  for (let effect of blockEffects) {
    for (let change of effect.changes) {
      if (change.key === "brsw-ac.gangup-reduction") {
        findBlock = false;
      }
    }
  }
  if (target.actor && findBlock) {
    if (
      target.actor.items.find((item) => {
        return item.name.toLowerCase().includes(improved_block_name);
      })
    ) {
      modifier = Math.max(0, modifier - 2);
    } else if (
      target.actor.items.find((item) => {
        return item.name.toLowerCase().includes(block_name);
      })
    ) {
      modifier = Math.max(0, modifier - 1);
    }
  }
  return Math.min(4, modifier);
}

/**
 * Gets the gangup reduction from an actor (using a custom AE
 * @param {Actor} target
 */
function gang_up_reduction(target) {
  let reduction = 0;
  for (let effect of target.appliedEffects) {
    if (!effect.disabled) {
      for (let change of effect.changes) {
        if (change.key === "brsw-ac.gangup-reduction") {
          reduction += parseInt(change.value) || 0;
        }
      }
    }
  }
  return reduction;
}

/**
 * Gets the gangup addition from an actor (using a custom AE)
 * @param {Actor} attacker
 */
function gang_up_addition(attacker) {
  let addition = 0;
  for (let effect of attacker.appliedEffects) {
    if (!effect.disabled) {
      for (let change of effect.changes) {
        if (change.key === "brsw-ac.gangup-addition") {
          addition += parseInt(change.value) ? change.value : 0;
        }
      }
    }
  }
  return addition;
}

// function from Kekilla
function withinRange(origin, target, range) {
  if (Math.abs(origin.document.elevation - target.document.elevation) >= 1) {
    return false;
  }
  const size_mod_origin = (origin.document.width + origin.document.height) / 2;
  const size_mod_target = (target.document.width + target.document.height) / 2;
  range = range - 0.5 + Math.max(size_mod_origin, size_mod_target);
  const ray = new Ray(origin, target);
  const grid_unit = canvas.grid.grid.options.dimensions.distance;
  let distance = canvas.grid.measureDistances([{ ray }], {
    gridSpaces: false,
  })[0];
  distance /= grid_unit;
  return range >= distance;
}

/**
 * Calculates appropriate illumination penalties
 * @param actorToken
 * @param targetToken
 * @param lighting The selected lighting level
 * @param distance The distance between token and target
 */
export async function find_illumination_penalty(
  actorToken,
  targetToken,
  lighting,
  distance,
) {
  const actor = actorToken.actor;
  let lowLiVision = "Low Light Vision"; //Ignore dim and dark
  let darkvision = "Darkvision"; //Ignore all up to 10"
  let blindsense = "Blindsense"; //Ignore all
  let nightvision = "Nightvision"; //Ignore all
  let infravision = "Infravision"; //Halves penalties against warm targets
  let undead = "Undead"; //Ignore all up to 10" (SWPF only)
  let abilityNames = [
    lowLiVision,
    darkvision,
    blindsense,
    nightvision,
    infravision,
  ];
  if (game.settings.get("betterrolls-swade2", "undeadIgnoresIllumination")) {
    abilityNames.push(undead);
  }
  let ownedAbilities = [];
  for (let abilityName of abilityNames) {
    if (actor.items.getName(abilityName)) {
      ownedAbilities = ownedAbilities.push(abilityName);
    }
  }

  let effects = actor.appliedEffects;
  let genericModifier = 0; //Generic modifier to ignore penalties
  for (let effect of effects) {
    for (let change of effect.data.changes) {
      if (
        change.key === "brsw.illumination-modifier" &&
        !effect.data.disabled
      ) {
        if (change.mode === 2) {
          genericModifier += Number(change.value);
        } else {
          console.warn(
            'Better Rolls 2 does only support the "Add" mode for illumination penalties on Active Effects.',
          );
        }
      }
    }
  }

  let illuminationPenalty = 0;
  if (lighting.toLowerCase() === "dim") {
    illuminationPenalty = -2;
  } else if (lighting.toLowerCase() === "dark") {
    illuminationPenalty = -4;
  } else if (lighting.toLowerCase() === "pitch darkness") {
    illuminationPenalty = -6;
  }
  if (
    ownedAbilities.includes(lowLiVision) &&
    (lighting.toLowerCase() === "dim" || lighting.toLowerCase() === "dark")
  ) {
    illuminationPenalty = 0;
  }
  illuminationPenalty += genericModifier;
  illuminationPenalty = Math.min(illuminationPenalty, 0);
  if (illuminationPenalty < 0) {
    if (ownedAbilities.includes(infravision)) {
      illuminationPenalty /= 2;
    }
    if (
      (ownedAbilities.includes(undead) ||
        ownedAbilities.includes(darkvision)) &&
      distance <= 10
    ) {
      illuminationPenalty = 0;
    }
    if (
      ownedAbilities.includes(blindsense) ||
      ownedAbilities.includes(nightvision)
    ) {
      illuminationPenalty = 0;
    }
  }
  return illuminationPenalty;
}
