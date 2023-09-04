// Common functions used in all cards
/* globals Token, TokenDocument, ChatMessage, renderTemplate, game, CONST, Roll, canvas, TextEditor, getProperty, duplicate, CONFIG, foundry, setProperty, getDocumentClass, succ, console, $ */
// noinspection JSUnusedAssignment

import {
  broofa,
  get_targeted_token,
  getWhisperData,
  simple_form,
  spendMastersBenny,
} from "./utils.js";
import { discount_pp, get_item_trait, roll_item } from "./item_card.js";
import {
  calculate_distance,
  get_tn_from_token,
  roll_skill,
} from "./skill_card.js";
import { roll_attribute } from "./attribute_card.js";
import {
  create_unshaken_card,
  create_unstun_card,
} from "./remove_status_cards.js";
import { get_gm_modifiers } from "./gm_modifiers.js";
import { brAction } from "./actions.js";
import { get_actions } from "./global_actions.js";
import { TraitRoll } from "./rolls.js";

export const BRSW_CONST = {
  TYPE_ATTRIBUTE_CARD: 1,
  TYPE_SKILL_CARD: 2,
  TYPE_ITEM_CARD: 3,
  TYPE_DMG_CARD: 10,
  TYPE_INC_CARD: 11,
  TYPE_INJ_CARD: 12,
  TYPE_UNSHAKE_CARD: 13,
  TYPE_UNSTUN_CARD: 14,
  TYPE_RESULT_CARD: 100,
};

/**
 * A constructor for our own roll object
 * @constructor
 */
export function BRWSRoll() {
  this.rolls = []; // Array with all the dice rolled {sides, result,
  // extra_class, tn, result_txt, result_icons, ap, armor, target_id}
  this.modifiers = []; // Array of modifiers {name,  value, extra_class, dice}
  this.dice = []; // Array with the dice {sides, results: [int], label, extra_class}
  // noinspection JSUnusedGlobalSymbols
  this.is_fumble = false;
}

/**
 * Stores a flag with the render data, deletes data can't be stored
 *
 * @param {ChatMessage} message
 * @param render_object
 */
async function store_render_flag(message, render_object) {
  for (let property of ["actor", "skill"]) {
    delete render_object[property];
  }
  // Get sure thar there is a diff so update socket gets fired.
  if (message.flags?.["betterrolls-swade2"]?.render_data) {
    message.flags["betterrolls-swade2"].render_data.update_uid = broofa();
  }
  await message.setFlag("betterrolls-swade2", "render_data", render_object);
}

export class BrCommonCard {
  constructor(message) {
    this.message = message;
    this.type = undefined;
    this.token_id = undefined;
    this.actor_id = undefined;
    this.item_id = undefined;
    this.skill_id = undefined;
    this.target_ids = [];
    this.environment = { light: "bright" };
    this.extra_text = "";
    this.attribute_name = ""; // If this is an attribute card, its name
    this.action_groups = {};
    this.render_data = {}; // Old render data, to be removed
    this.update_list = {}; // List of properties pending to be updated
    this.trait_roll = new TraitRoll();
    if (message) {
      const data = this.message.getFlag("betterrolls-swade2", "br_data");
      if (data) {
        this.load(data);
        // console.log("New card loaded from message")
        // console.trace()
        // TODO: Check if activate_common_listeners can be made a method of this class and simplified.
        // TODO: Reduce card creations. Attribute rolls done.
      }
    } else {
      this.id = broofa();
      this.recover_targets_from_user();
      // TODO: Change targets when rolling a trait
      // TODO: Change targets when rolling damage
      // TODO: Change targets when clicking on the trait result
      // TODO: Change targets when clicking on the damage result
      // TODO: Use the targets from the card data not the current ones
    }
  }

  async save() {
    if (!this.message) {
      await this.create_foundry_message(undefined);
    }
    if (Object.keys(this.update_list).length > 0) {
      this.update_list.id = this.message.id;
      this.message.update(this.update_list);
    }
    await this.message.setFlag(
      "betterrolls-swade2",
      "br_data",
      this.get_data(),
    );
    // Temporary
    await store_render_flag(this.message, this.render_data);
  }

  /**
   * Prepares the data to be saved
   **/
  get_data() {
    return {
      type: this.type,
      token_id: this.token_id,
      actor_id: this.actor_id,
      item_id: this.item_id,
      skill_id: this.skill_id,
      environment: this.environment,
      extra_text: this.extra_text,
      attribute_name: this.attribute_name,
      action_groups: this.action_groups,
      id: this.id,
      target_ids: this.target_ids,
      trait_roll: this.trait_roll,
    };
  }

  load(data) {
    const FIELDS = [
      "id",
      "type",
      "token_id",
      "actor_id",
      "item_id",
      "skill_id",
      "environment",
      "extra_text",
      "attribute_name",
      "action_groups",
      "target_ids",
    ];
    for (let field of FIELDS) {
      this[field] = data[field];
    }
    this.trait_roll.load(data.trait_roll);
    if (this.message) {
      this.render_data = this.message.getFlag(
        "betterrolls-swade2",
        "render_data",
      );
    }
  }

  get token() {
    if (canvas.tokens) {
      if (this.token_id) {
        return canvas.tokens.get(this.token_id);
      }
      if (this.actor_id) {
        return this.actor.getActiveTokens()[0];
      }
    }
    return undefined;
  }

  get actor() {
    // We always prefer the token actor if available
    if (this.token_id) {
      const { token } = this;
      if (token) {
        // Token can be undefined even with and id the scene is note
        // ready or the token has been removed.
        return token.actor;
      }
    }
    if (this.actor_id) {
      return game.actors.get(this.actor_id);
    }
    return undefined;
  }

  get item() {
    return this.actor.items.find((item) => item.id === this.item_id);
  }

  get skill() {
    if (this.skill_id) {
      return this.actor.items.find((item) => item.id === this.skill_id);
    }
    if (this.item_id) {
      const trait = get_item_trait(this.item, this.actor);
      if (Object.hasOwn(trait, "type") && trait.type === "skill") {
        this.skill_id = trait.id;
      }
      return trait;
    }
  }

  get sorted_action_groups() {
    let groups_array = Object.values(this.action_groups);
    return groups_array.sort((a, b) => {
      return a.name > b.name ? 1 : -1;
    });
  }

  get targets() {
    const target_array = [];
    for (const target_id in this.target_ids) {
      target_array.push(canvas.tokens.get(target_id));
    }
    return target_array;
  }

  get bennie_avaliable() {
    return are_bennies_available(this.actor);
  }

  recover_targets_from_user() {
    this.target_ids = [];
    for (const target of game.user.targets) {
      this.target_ids.push(target.id);
    }
  }

  populate_actions() {
    this.action_groups = {};
    this.populate_world_actions();
    if (
      this.item &&
      !game.settings.get("betterrolls-swade2", "hide-weapon-actions")
    ) {
      this.populate_item_actions();
    }
    this.populate_active_effect_actions();
    for (const group in this.action_groups) {
      this.action_groups[group].actions.sort((a, b) => {
        return a.code.id > b.code.id ? 1 : -1;
      });
    }
  }

  populate_world_actions() {
    const item = this.item ||
      this.skill || { type: "attribute", name: this.attribute_name };
    for (const global_action of get_actions(item, this.actor)) {
      const name =
        global_action.button_name.slice(0, 5) === "BRSW."
          ? game.i18n.localize(global_action.button_name)
          : global_action.button_name;
      let group_name = global_action.group || "BRSW.NoGroup";
      let group_name_id = group_name.split(".").join("");
      if (global_action.hasOwnProperty("extra_text")) {
        this.extra_text += global_action.extra_text;
      }
      if (!this.action_groups.hasOwnProperty(group_name_id)) {
        const translated_group = game.i18n.localize(group_name);
        this.action_groups[group_name_id] = {
          name: translated_group,
          actions: [],
          id: broofa(),
        };
      }
      let new_action = new brAction(name, global_action);
      if (global_action.hasOwnProperty("defaultChecked")) {
        new_action.selected = true;
      }
      this.action_groups[group_name_id].actions.push(new_action);
    }
  }

  populate_item_actions() {
    let item_actions = [];
    for (let action in this.item.system?.actions?.additional) {
      let br_action = new brAction(
        this.item.system.actions.additional[action].name,
        this.item.system.actions.additional[action],
        "item",
      );
      item_actions.push(br_action);
    }
    if (item_actions.length) {
      const name = game.i18n.localize("BRSW.ItemActions");
      this.action_groups[name] = {
        name: name,
        actions: item_actions,
        id: broofa(),
      };
    }
  }

  populate_active_effect_actions() {
    const attGlobalMods =
      this.actor.system.stats.globalMods[this.skill.system.attribute] ?? [];
    const effectArray = [
      ...this.actor.system.stats.globalMods.trait,
      ...attGlobalMods,
      ...this.skill.system.effects,
    ];
    let effectActions = [];
    for (let effect of effectArray) {
      console.log(effect);
      const br_action = new brAction(
        effect.label,
        { skillMod: effect.value, name: effect.label, id: broofa() },
        "active_effect",
      );
      br_action.selected = !effect.ignore;
      effectActions.push(br_action);
    }
    if (effectActions.length) {
      const name = game.i18n.localize("BRSW.ActiveEffects");
      this.action_groups[name] = {
        name: name,
        actions: effectActions,
        id: broofa(),
      };
    }
  }

  set_active_actions(actions) {
    for (let group in this.action_groups) {
      for (let action of this.action_groups[group].actions) {
        action.selected = actions.includes(action.code.id);
      }
    }
  }

  /**
   * Creates an object to store some data in the old render_data flag.
   * @param render_data
   * @param template
   * @returns {*}
   */
  generate_render_data(render_data, template) {
    render_data.actor = this.actor;
    render_data.result_master_only =
      game.settings.get("betterrolls-swade2", "result-card") === "master";
    // Benny image
    render_data.benny_image =
      game.settings.get("swade", "bennyImage3DFront") ||
      "/systems/swade/assets/benny/benny-chip-front.png";
    render_data.collapse_results = !game.settings.get(
      "betterrolls-swade2",
      "expand-results",
    );
    render_data.collapse_rolls = !game.settings.get(
      "betterrolls-swade2",
      "expand-rolls",
    );
    if (template) {
      render_data.template = template;
    }
    this.check_warnings(render_data);
    this.render_data = render_data;
    return render_data;
  }

  get show_rerolls() {
    if (
      game.settings.get("swade", "dumbLuck") ||
      !this.trait_roll.current_roll
    ) {
      return true;
    }
    return (
      this.trait_roll.current_roll && !this.trait_roll.current_roll.is_fumble
    );
  }

  /**
   * Recovers the trait used in card
   */
  get_trait() {
    if (
      this.render_data.hasOwnProperty("trait_id") &&
      this.render_data.trait_id
    ) {
      let trait;
      if (this.render_data.trait_id.hasOwnProperty("name")) {
        // This is an attribute
        trait = this.render_data.trait_id;
      } else {
        // Should be a skill
        trait = this.actor.items.get(this.render_data.trait_id);
      }
      this.render_data.skill = trait;
      this.render_data.skill_title = trait
        ? trait.name + " " + trait_to_string(trait.system)
        : "";
    }
  }

  /**
   * Checks and creates a warning in the top of the card
   */
  check_warnings(render_data) {
    if (this.actor.system.status.isStunned) {
      render_data.warning = `<span class="br2-unstun-card brsw-clickable">${game.i18n.localize(
        "BRSW.CharacterIsStunned",
      )}</span>`;
    } else if (this.actor.system.status.isShaken) {
      render_data.warning = `<span class="br2-unshake-card brsw-clickable">${game.i18n.localize(
        "BRSW.CharacterIsShaken",
      )}</span>`;
    } else if (
      this.item?.system.actions?.trait.toLowerCase() ===
      game.i18n.localize("BRSW.none").toLowerCase()
    ) {
      render_data.warning = game.i18n.localize("BRSW.NoRollRequired");
    } else if (this.item?.system.quantity <= 0) {
      render_data.warning = game.i18n.localize("BRSW.QuantityIsZero");
    } else {
      render_data.warning = "";
    }
  }

  async render() {
    if (Object.keys(this.action_groups).length === 0) {
      this.populate_actions();
    }
    this.get_trait();
    let new_content = await renderTemplate(
      this.render_data.template,
      this.get_data_render(),
    );
    TextEditor.enrichHTML(new_content, { async: false });
    if (this.message) {
      this.update_list.content = new_content;
    } else {
      await this.create_foundry_message(new_content);
    }
  }

  /**
   * Temporal stop gap until render_data is removed, and we pass the class
   * to the template
   */
  get_data_render() {
    const data = {
      ...this.get_data(),
      ...this.render_data,
      ...{ sorted_action_groups: this.sorted_action_groups },
    };
    data.actor = this.actor;
    data.item = this.item;
    data.bennie_avaliable = this.bennie_avaliable;
    data.show_rerolls = this.show_rerolls;
    data.selected_actions = this.get_selected_actions();
    return data;
  }

  /**
   * Returns an action from an id
   */
  get_action_from_id(action_id) {
    for (let group in this.action_groups) {
      for (let action of this.action_groups[group].actions) {
        if (action.code.name === action_id) {
          return action;
        }
      }
    }
    return null;
  }

  /**
   * Returns the actions currently selected in the card
   */
  get_selected_actions() {
    let selected_actions = [];
    for (let group in this.action_groups) {
      for (let action of this.action_groups[group].actions) {
        if (action.selected) {
          selected_actions.push(action);
        }
      }
    }
    return selected_actions;
  }

  /**
   * Creates the Foundry message object
   */
  async create_foundry_message(new_content) {
    let chatData = create_basic_chat_data(this.actor);
    if (new_content) {
      chatData.content = new_content;
    }
    this.message = await ChatMessage.create(chatData);
  }
}

/**
 * Makes the br_card class accesible
 *
 */
export function expose_card_class() {
  game.brsw.BrCommonCard = BrCommonCard;
}

/**
 * Creates a char card
 *
 * @param {PlaceableObject, SwadeActor} origin The origin of this card
 * @param {object} render_data Data to pass to the render template
 * @param chat_type Type of char message
 * @param {string} template Path to the template that renders this card
 */
export async function create_common_card(
  origin,
  render_data,
  chat_type,
  template,
) {
  let actor;
  if (origin instanceof TokenDocument || origin instanceof Token) {
    actor = origin.actor;
  } else {
    actor = origin;
  }
  let br_message = new BrCommonCard(undefined);
  br_message.actor_id = actor.id;
  if (actor !== origin) {
    br_message.token_id = origin.id;
  }
  br_message.generate_render_data(render_data, template);
  return br_message;
}

/**
 * Creates the basic chat data common to most cards
 * @param {SwadeActor, Token} origin -  The actor origin of the message
 * @return {Object} An object suitable to create a ChatMessage
 */
export function create_basic_chat_data(origin) {
  let actor;
  let token;
  if (origin instanceof TokenDocument || origin instanceof Token) {
    // This is a token or a TokenDocument
    actor = origin.actor;
    token = origin;
  } else {
    // This is an actor
    actor = origin;
    token = actor.token;
  }
  let whisper_data = getWhisperData();
  // noinspection JSUnresolvedVariable
  let chatData = {
    user: game.user.id,
    content: "<p>Default content, likely an error in Better Rolls</p>",
    speaker: {
      actor: actor._idx,
      token: token ? token.id : token,
      alias: origin.name,
    },
    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    blind: whisper_data.blind,
    flags: { core: { canPopout: true } },
  };
  if (whisper_data.whisper) {
    chatData.whisper = whisper_data.whisper;
  }
  chatData.roll = new Roll("0").roll({ async: false });
  chatData.rollMode = whisper_data.rollMode;
  // noinspection JSValidateTypes
  return chatData;
}

/**
 * Returns true if an actor has bennies available or is master controlled.
 * @param {SwadeActor} actor - The actor that we are checking
 */
export function are_bennies_available(actor) {
  if (actor.hasPlayerOwner) {
    return actor.system.bennies.value > 0;
  } else if (actor.system.wildcard && actor.system.bennies.value > 0) {
    return true;
  }
  return game.user.getFlag("swade", "bennies") > 0;
}

/**
 * Expends a bennie
 * @param {SwadeActor} actor - Actor who is going to expend the bennie
 */
export async function spend_bennie(actor) {
  // Dice so Nice animation
  if (actor.hasPlayerOwner) {
    await actor.spendBenny();
  } else if (actor.system.wildcard && actor.system.bennies.value > 0) {
    await actor.spendBenny();
  } else {
    await spendMastersBenny();
    if (game.dice3d) {
      const benny = new Roll("1dB").roll({ async: false });
      // noinspection JSIgnoredPromiseFromCall,ES6MissingAwait
      game.dice3d.showForRoll(benny, game.user, true, null, false);
    }
  }
}

/**
 * Try to get an actor from a token or an actor id
 * @param token_id
 * @param actor_id
 */
export function get_actor_from_ids(token_id, actor_id) {
  if (canvas.tokens) {
    let token;
    if (token_id) {
      try {
        token = canvas.tokens.get(token_id);
      } catch (_) {
        // At boot the canvas can be still not drawn, we wait
        // noinspection AnonymousFunctionJS
        setTimeout(() => {
          token = canvas.tokens.get(token_id);
        }, 500);
      }
      if (token) {
        return token.actor;
      }
    }
  }
  // If we couldn't get the token, maybe because it was not defined actor.
  if (actor_id) {
    return game.actors.get(actor_id);
  }
}

/**
 * Connects the listener for all chat cards
 * @param {BrCommonCard} br_card
 * @param {HTMLElement} html - html of the card
 */
export function activate_common_listeners(br_card, html) {
  html = $(html); // Get sure html is a Jquery element
  // The message will be rendered at creation and each time a flag is added
  // Actor will be undefined if this is called before flags are set
  if (br_card.actor) {
    // noinspection JSUnresolvedFunction,AnonymousFunctionJS
    html
      .find(".brws-actor-img")
      .addClass("bound")
      .click(async () => {
        await manage_sheet(br_card.actor);
      });
    //
    html.find(".br2-unshake-card").on("click", () => {
      // noinspection JSIgnoredPromiseFromCall
      create_unshaken_card(br_card.message, undefined);
    });
    html.find(".br2-unstun-card").on("click", () => {
      // noinspection JSIgnoredPromiseFromCall
      create_unstun_card(br_card.message, undefined);
    });
  }
  html.find(".brsw-selected-actions").on("click", async (ev) => {
    console.log(ev.currentTarget.dataset);
    console.log(ev.currentTarget);
    game.brsw.dialog.show_card(br_card);
  });
  // Selectable modifiers
  // noinspection JSUnresolvedFunction
  html
    .find(".brws-selectable")
    .click((ev) => manage_selectable_click(ev, br_card.message));
  // Collapsable fields
  manage_collapsables(html);
  // Old rolls
  // noinspection JSUnresolvedFunction
  html.find(".brsw-old-roll").click(async (ev) => {
    await old_roll_clicked(ev, br_card);
  });
  // Add modifiers
  // noinspection JSUnresolvedFunction
  html.find(".brsw-add-modifier").click(() => {
    const label_mod = game.i18n.localize("BRSW.Modifier");
    simple_form(
      game.i18n.localize("BRSW.AddModifier"),
      [
        {
          id: "label",
          label: game.i18n.localize("BRSW.Label"),
          default_value: "",
        },
        {
          id: "value",
          label: label_mod,
          default_value: 1,
        },
      ],
      async (values) => {
        await add_modifier(br_card, {
          label: values.label,
          value: values.value,
        });
      },
    );
  });
  // Edit modifiers
  // noinspection JSUnresolvedFunction
  html.find(".brsw-edit-modifier").click((ev) => {
    const label_mod = game.i18n.localize("BRSW.Modifier");
    const { value, label, index } = ev.currentTarget.dataset;
    simple_form(
      game.i18n.localize("BRSW.EditModifier"),
      [
        { label: "Label", default_value: label },
        { id: "value", label: label_mod, default_value: value },
      ],
      async (values) => {
        await edit_modifier(br_card, parseInt(index), {
          name: values.Label,
          value: values.value,
          extra_class: parseInt(values.value) < 0 ? " brsw-red-text" : "",
        });
      },
    );
  });
  // Edit die results
  // noinspection JSUnresolvedFunction
  html.find(".brsw-override-die").click((ev) => {
    // Retrieve additional data
    const die_index = Number(ev.currentTarget.dataset.dieIndex);
    // Show modal
    const label_new_result = game.i18n.localize("BRSW.NewDieResult");
    simple_form(
      game.i18n.localize("BRSW.EditDieResult"),
      [{ label: label_new_result, default_value: 0, id: "new_result" }],
      async (values) => {
        const new_value = values.new_result;
        // Actual roll manipulation
        await override_die_result(br_card, die_index, new_value);
      },
    );
  });
  // Delete modifiers
  // noinspection JSUnresolvedFunction
  html.find(".brsw-delete-modifier").click(async (ev) => {
    await delete_modifier(br_card, parseInt(ev.currentTarget.dataset.index));
  });
  // Edit TNs
  // noinspection JSUnresolvedFunction
  html.find(".brsw-edit-tn").click(async (ev) => {
    const old_tn = ev.currentTarget.dataset.value;
    const tn_trans = game.i18n.localize("BRSW.TN");
    simple_form(
      game.i18n.localize("BRSW.EditTN"),
      [{ id: "tn", label: tn_trans, default_value: old_tn }],
      async (values) => {
        await edit_tn(br_card, values.tn, "");
      },
    );
  });
  // TNs from target
  // noinspection JSUnresolvedFunction
  html.find(".brsw-target-tn, .brsw-selected-tn").click((ev) => {
    const index = ev.currentTarget.dataset.index;
    get_tn_from_target(
      br_card,
      parseInt(index),
      ev.currentTarget.classList.contains("brsw-selected-tn"),
    );
  });
  // Repeat card
  // noinspection JSUnresolvedFunction
  html.find(".brsw-repeat-card").click((ev) => {
    // noinspection JSIgnoredPromiseFromCall
    duplicate_message(br_card.message, ev);
  });
}

/**
 * Manage collapsable fields
 * @param html
 */
export function manage_collapsables(html) {
  let collapse_buttons = html.find(".brsw-collapse-button");
  collapse_buttons.click(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    let clicked = $(e.currentTarget);
    const data_collapse = clicked.attr("data-collapse");
    const collapsable_span = html.find("." + data_collapse);
    collapsable_span.toggleClass("brsw-collapsed");
    if (collapsable_span.hasClass("brsw-collapsed")) {
      const button = clicked.find(".fas.fa-caret-down");
      button.removeClass("fa-caret-down");
      button.addClass("fa-caret-right");
    } else {
      const button = clicked.find(".fas.fa-caret-right");
      button.removeClass("fa-caret-right");
      button.addClass("fa-caret-down");
    }
  });
}

/**
 * Mark and unmark selectable items
 * @param ev mouse click event
 * @param {ChatMessage} message - The message that contains the selectable item
 */
export async function manage_selectable_click(ev, message) {
  ev.preventDefault();
  ev.stopPropagation();
  if (!message || !ev.currentTarget.dataset.action_id) {
    return manage_html_selectables(ev);
  }
  const br_card = new BrCommonCard(message);
  let action = br_card.get_action_from_id(ev.currentTarget.dataset.action_id);
  action.selected = !action.selected;
  await br_card.render();
  await br_card.save();
}

/**
 * Manage selectables not based on cards
 * @param ev
 */
function manage_html_selectables(ev) {
  if (ev.currentTarget.classList.contains("brws-permanent-selected")) {
    ev.currentTarget.classList.remove("brws-permanent-selected");
  } else if (ev.currentTarget.classList.contains("brws-selected")) {
    ev.currentTarget.classList.remove("brws-selected");
  } else {
    ev.currentTarget.classList.add("brws-permanent-selected");
    ev.currentTarget.classList.add("brws-selected");
  }
}

/**
 * Controls the sheet status when the portrait in the header is clicked
 * @param {SwadeActor} actor - The actor instance that created the chat card
 */
async function manage_sheet(actor) {
  if (actor.sheet.rendered) {
    // noinspection JSAccessibilityCheck
    if (actor.sheet._minimized) {
      await actor.sheet.maximize();
    } else {
      await actor.sheet.minimize();
    }
  } else {
    await actor.sheet.render(true);
  }
}

/**
 * Gets the expected action, whenever to show the card, do a system roll, etc.,
 * from a click event and the settings
 * @param {event} event
 */
export function get_action_from_click(event) {
  let setting_name = "click";
  // noinspection JSUnresolvedVariable
  if (event.shiftKey) {
    setting_name = "shift_click";
  } else if (event.ctrlKey) {
    setting_name = "ctrl_click";
  } else if (event.altKey) {
    setting_name = "alt_click";
  }
  return game.settings.get("betterrolls-swade2", setting_name);
}

/**
 * Gets the roll options from the card html
 *
 * @param old_options - Options used as default
 */
export function get_roll_options(old_options) {
  let modifiers = old_options.additionalMods || [];
  let dmg_modifiers = old_options.dmgMods || [];
  let tn = old_options.tn || 4;
  let tn_reason = old_options.tn_reason || game.i18n.localize("BRSW.Default");
  let rof = old_options.rof || 1;
  // We only check for modifiers when there are no old ones.
  if (!old_options.hasOwnProperty("additionalMods")) {
    $(".brsw-chat-form .brws-selectable.brws-selected").each((_, element) => {
      if (element.dataset.type === "modifier") {
        modifiers.push(element.dataset.value);
      } else if (element.dataset.type === "dmg_modifier") {
        dmg_modifiers.push(element.dataset.value);
      } else if (element.dataset.type === "rof") {
        rof = parseInt(element.dataset.value);
      }
      // Unmark mod
      if (!element.classList.contains("brws-permanent-selected")) {
        element.classList.remove("brws-selected");
      }
    });
    const dice_tray_input = $("input.dice-tray__input");
    let tray_modifier = parseInt(dice_tray_input.val());
    if (tray_modifier) {
      modifiers.push(tray_modifier);
      dice_tray_input.val("0");
    }
  }
  return {
    additionalMods: modifiers,
    dmgMods: dmg_modifiers,
    tn: tn,
    rof: rof,
    tn_reason: tn_reason,
  };
}

/**
 * Function to convert trait dice and modifiers into a string
 * @param trait
 */
export function trait_to_string(trait) {
  let string = `d${trait.die.sides}`;
  let modifier = parseInt(trait.die.modifier);
  if (modifier) {
    string = string + (modifier > 0 ? "+" : "") + modifier;
  }
  return string;
}

export async function detect_fumble(remove_die, fumble_possible, result, dice) {
  if (!remove_die && fumble_possible < 1) {
    let test_fumble_roll = new Roll("1d6");
    await test_fumble_roll.roll({ async: true });
    await test_fumble_roll.toMessage({
      flavor: game.i18n.localize("BRWS.Testing_fumbles"),
    });
    if (test_fumble_roll.total === 1) {
      return true; // Fumble mark
    }
  } else if (
    remove_die &&
    fumble_possible < 0 &&
    dice[dice.length - 1].raw_total === 1
  ) {
    return true;
  }
  return false;
}

/**
 * Calculates the results of a roll
 * @param {[]} rolls A rolls list see BSWRoll doc
 * @param {boolean} damage True if this is a damage roll
 * @param {boolean} remove_die True to remove a result, that usually means a
 *  trait roll made by a Wild Card
 * @param {Array} dice - The dice array that contains individual dice in a result
 */
export async function calculate_results(rolls, damage, remove_die, dice) {
  let result = 0;
  let minimum_value = 10000000;
  let min_position = 0;
  let fumble_possible = 0;
  for (const [index, roll] of rolls.entries()) {
    fumble_possible += roll.fumble_value;
    if (roll.result <= minimum_value) {
      min_position = index;
      minimum_value = roll.result;
    }
    result = roll.result - roll.tn;
    if (roll.ap) {
      // We have an AP value, add it to the result
      result += Math.min(roll.ap, roll.armor);
    }
    if (result < 0) {
      roll.result_text = game.i18n.localize("BRSW.Failure");
      roll.result_icon = '<i class="brsw-red-text fas fa-minus-circle"></i>';
    } else if (result < 4) {
      if (damage) {
        roll.result_text = game.i18n.localize("BRSW.Shaken");
        roll.result_icon = '<i class="brsw-blue-text fas fa-certificate"></i>';
      } else {
        roll.result_text = game.i18n.localize("BRSW.Success");
        roll.result_icon = '<i class="brsw-blue-text fas fa-check"></i>';
      }
    } else if (result < 8) {
      if (damage) {
        roll.result_text = game.i18n.localize("BRSW.Wound");
        roll.result_icon = '<i class="brsw-red-text fas fa-tint"></i>';
      } else {
        roll.result_text = game.i18n.localize("BRSW.Raise");
        roll.result_icon = '<i class="brsw-blue-text fas fa-check-double"></i>';
      }
    } else {
      const raises = Math.floor(result / 4);
      if (damage) {
        roll.result_text = game.i18n.localize("BRSW.Wounds") + " " + raises;
        roll.result_icon =
          raises.toString() + " " + '<i class="brsw-red-text fas fa-tint"></i>';
      } else {
        roll.result_text =
          game.i18n.localize("BRSW.Raise_plural") + " " + raises;
        roll.result_icon =
          raises.toString() +
          '<i class="brsw-blue-text fas fa-check-double"></i>';
      }
    }
  }
  // Remove lower die.
  if (remove_die && dice.length) {
    rolls[min_position].extra_class += " brsw-discarded-roll";
    rolls[min_position].tn = 0;
    dice[min_position].extra_class += " brsw-discarded-roll";
    dice[dice.length - 1].label = game.i18n.localize("SWADE.WildDie");
  }
  if (result < 0) {
    result = 0;
  } else if (result === 0) {
    result = 0.01; // Ugly hack to differentiate from failure
  }
  if (!damage) {
    return await detect_fumble(remove_die, fumble_possible, result, dice);
  }
  return result;
}

/**
 * Updates a message using a new render_data
 * @param {ChatMessage, BrCommonCard} br_message
 * @param render_data
 */
export async function update_message(br_message, render_data) {
  if (!br_message.hasOwnProperty("action_groups")) {
    br_message = new BrCommonCard(br_message);
  }
  if (br_message.type === BRSW_CONST.TYPE_ITEM_CARD) {
    render_data.skill = get_item_trait(br_message.item, br_message.actor);
  }
  br_message.generate_render_data(render_data, undefined);
  await br_message.render();
  await br_message.save();
}

/**
 * Checks and rolls convictions
 * @param {SwadeActor }actor
 * @return Modifiers Array
 */
export function check_and_roll_conviction(actor) {
  let conviction_modifier;
  if (
    actor.isWildcard &&
    game.settings.get("swade", "enableConviction") &&
    getProperty(actor.system, "details.conviction.active")
  ) {
    let conviction_roll = new Roll("1d6x");
    conviction_roll.roll({ async: false });
    // noinspection JSIgnoredPromiseFromCall
    conviction_roll.toMessage({
      flavor: game.i18n.localize("BRSW.ConvictionRoll"),
    });
    conviction_modifier = create_modifier(
      game.i18n.localize("SWADE.Conv"),
      conviction_roll.total,
    );
  }
  return conviction_modifier;
}

function get_below_chat_modifiers(options, roll_options) {
  // Betterrolls modifiers
  options.additionalMods.forEach((mod) => {
    const mod_value = parseInt(mod);
    roll_options.modifiers.push(create_modifier("Better Rolls", mod_value));
    roll_options.total_modifiers += mod_value;
  });
  // Master Modifiers
  const master_modifiers = get_gm_modifiers();
  if (master_modifiers) {
    roll_options.modifiers.push(
      create_modifier(game.i18n.localize("BRSW.GMModifier"), master_modifiers),
    );
    roll_options.total_modifiers += master_modifiers;
  }
}

function get_actor_own_modifiers(actor, roll_options) {
  // Wounds
  const woundPenalties = actor.calcWoundPenalties();
  if (woundPenalties !== 0) {
    roll_options.modifiers.push(
      create_modifier(game.i18n.localize("SWADE.Wounds"), woundPenalties),
    );
    roll_options.total_modifiers += woundPenalties;
  }
  // Fatigue
  const fatiguePenalties = actor.calcFatiguePenalties();
  if (fatiguePenalties !== 0) {
    roll_options.modifiers.push(
      create_modifier(game.i18n.localize("SWADE.Fatigue"), fatiguePenalties),
    );
    roll_options.total_modifiers += fatiguePenalties;
  }
  // Wounds or Fatigue ignored
  if (actor.system.woundsOrFatigue.ignored) {
    const ignored = Math.min(
      parseInt(actor.system.woundsOrFatigue.ignored) || 0,
      -fatiguePenalties - woundPenalties,
    );
    if (ignored) {
      roll_options.modifiers.push(
        create_modifier(
          game.i18n.localize("BRSW.WoundsOrFatigueIgnored"),
          ignored,
        ),
      );
      roll_options.total_modifiers += ignored;
    }
  }
  // Own status
  const statusPenalties = actor.calcStatusPenalties();
  if (statusPenalties !== 0) {
    roll_options.modifiers.push(
      create_modifier(game.i18n.localize("SWADE.Status"), statusPenalties),
    );
    roll_options.total_modifiers += statusPenalties;
  }
}

/**
 * Get all the options needed for a new roll
 * @param {BrCommonCard} br_card
 * @param extra_data
 * @param trait_dice
 * @param roll_options - An object with the current roll_options
 */
async function get_new_roll_options(
  br_card,
  extra_data,
  trait_dice,
  roll_options,
) {
  let extra_options = {};
  let objetive = get_targeted_token();
  if (!objetive) {
    canvas.tokens.controlled.forEach((token) => {
      // noinspection JSUnresolvedVariable
      if (token.actor !== br_card.actor) {
        objetive = token;
      }
    });
  }
  if (objetive && br_card.skill) {
    const origin_token = br_card.token;
    if (origin_token) {
      const target_data = get_tn_from_token(
        br_card.skill,
        objetive,
        origin_token,
        br_card.item,
      );
      br_card.trait_roll.tn = target_data.value;
      br_card.trait_roll.tn_reason = target_data.reason;
      extra_options.target_modifiers = target_data.modifiers;
    }
  }
  if (extra_data.hasOwnProperty("tn")) {
    extra_options.tn = extra_data.tn;
    extra_options.tn_reason = extra_data.tn_reason.slice(0, 20);
  }
  if (extra_data.hasOwnProperty("rof")) {
    extra_options.rof = extra_data.rof;
  }
  let options = get_roll_options(extra_options);
  roll_options.rof = options.rof || 1;
  // Trait modifier
  if (parseInt(trait_dice.die.modifier)) {
    const mod_value = parseInt(trait_dice.die.modifier);
    roll_options.modifiers.push(
      create_modifier(game.i18n.localize("BRSW.TraitMod"), mod_value),
    );
  }
  get_below_chat_modifiers(options, roll_options);
  get_actor_own_modifiers(br_card.actor, roll_options);
  // Armor min str
  if (br_card.skill?.system.attribute === "agility") {
    let armor_penalty = get_actor_armor_minimum_strength(br_card.actor);
    if (armor_penalty) {
      roll_options.modifiers.push(armor_penalty);
    }
  }
  // Target Mods
  if (extra_options.target_modifiers) {
    extra_options.target_modifiers.forEach((modifier) => {
      roll_options.modifiers.push(modifier);
    });
  }
  // Options set from card
  if (extra_data.modifiers) {
    extra_data.modifiers.forEach((modifier) => {
      roll_options.modifiers.push(modifier);
    });
  }
  //Conviction
  const conviction_modifier = check_and_roll_conviction(br_card.actor);
  if (conviction_modifier) {
    roll_options.modifiers.push(conviction_modifier);
  }
  // Joker
  if (br_card.token && has_joker(br_card.token.id)) {
    roll_options.modifiers.push(create_modifier("Joker", 2));
  }
  // Encumbrance
  const npc_avoid_encumbrance =
    game.settings
      .get("betterrolls-swade2", "optional_rules_enabled")
      .indexOf("NPCDontUseEncumbrance") > -1;
  if (br_card.actor.type === "character" || !npc_avoid_encumbrance) {
    if (br_card.actor.isEncumbered) {
      if (
        br_card.attribute_name === "agility" ||
        br_card.skill?.system.attribute === "agility"
      ) {
        roll_options.modifiers.push({
          name: game.i18n.localize("SWADE.Encumbered"),
          value: -2,
        });
      }
    }
  }
}

/**
 * Get the options for a reroll
 * @param {BrCommonCard} br_card - The card to get the options from
 * @param {Object} extra_data
 */
function get_reroll_options(br_card, extra_data) {
  // Reroll, keep old options
  let reroll_mods_applied = false;
  br_card.trait_roll.modifiers.forEach((mod) => {
    if (mod.name.includes("(reroll)")) {
      reroll_mods_applied = true;
    }
  });
  if (extra_data.reroll_modifier && !reroll_mods_applied) {
    br_card.trait_roll.modifiers.push(
      create_modifier(
        `${extra_data.reroll_modifier.name} (reroll)`,
        extra_data.reroll_modifier.value,
      ),
    );
  }
}

/**
 * Show the 3d dice for a trait roll
 * @param {BrCommonCard} br_card
 * @param {Roll} roll
 */
async function show_3d_dice(br_card, roll) {
  if (br_card.trait_roll.wild_die) {
    set_wild_die_theme(roll.dice[roll.dice.length - 1]);
  }
  let users = null;
  if (br_card.message.whisper.length > 0) {
    users = br_card.message.whisper;
  }
  const blind = br_card.message.blind;
  // Dice buried in modifiers.
  for (let modifier of br_card.trait_roll.modifiers) {
    if (modifier.dice && modifier.dice instanceof Roll) {
      // noinspection ES6MissingAwait
      game.dice3d.showForRoll(modifier.dice, game.user, true, users, blind);
    }
  }
  await game.dice3d.showForRoll(roll, game.user, true, users, blind);
}

function set_wild_die_theme(wildDie) {
  const dieSystem = game.user.getFlag("swade", "dsnWildDiePreset") || "none";
  if (!dieSystem || dieSystem === "none") {
    return;
  }
  const colorSet = game.user.getFlag("swade", "dsnWildDie") || "none";
  if (colorSet === "customWildDie") {
    // Build the custom appearance and set it
    const customColors = game.user.getFlag("swade", "dsnCustomWildDieColors");
    const customOptions = game.user.getFlag("swade", "dsnCustomWildDieOptions");
    const customAppearance = {
      colorset: "custom",
      foreground: customColors?.labelColor,
      background: customColors?.diceColor,
      edge: customColors?.edgeColor,
      outline: customColors?.outlineColor,
      font: customOptions?.font,
      material: customOptions?.material,
      texture: customOptions?.texture,
      system: dieSystem,
    };
    setProperty(wildDie, "options.appearance", customAppearance);
  } else {
    // Set the preset
    setProperty(wildDie, "options.colorset", colorSet);
    setProperty(wildDie, "options.appearance.system", dieSystem);
  }
  // Get the dicePreset for the given die type
  const dicePreset = game.dice3d?.DiceFactory.systems[dieSystem].dice.find(
    (d) => d.type === "d" + wildDie.faces,
  );
  if (!dicePreset) {
    return;
  }
  if (dicePreset?.modelFile && !dicePreset.modelLoaded) {
    // Load the modelFile
    dicePreset.loadModel(game.dice3d?.DiceFactory.loaderGLTF);
  }
  // Load the textures
  dicePreset.loadTextures();
}

/**
 * Creates a roll string from a trait a number of dice
 * @param trait_dice
 * @param rof
 * @return {string}
 */
function create_roll_string(trait_dice, rof) {
  let roll_string = `1d${trait_dice.die.sides}x`;
  // @zk-sn: If roll is a 1d1x (example: Strength score of 1), change it to 1d1 to prevent exploding die recursion.  (Fix for #211)
  if (roll_string === `1d1x`) {
    roll_string = `1d1`;
    for (let i = 0; i < rof - 1; i++) {
      roll_string += `+1d${trait_dice.die.sides}`;
    }
  } else {
    for (let i = 0; i < rof - 1; i++) {
      roll_string += `+1d${trait_dice.die.sides}x`;
    }
  }
  return roll_string;
}

/**
 * Makes a roll trait
 * @param {BrCommonCard}br_card
 * @param trait_dice - An object representing a trait dice
 * @param dice_label - Label for the trait die
 * @param extra_data - Extra data to add to render options
 */
export async function roll_trait(br_card, trait_dice, dice_label, extra_data) {
  let { actor } = br_card;
  let roll_options = { modifiers: [], rof: undefined };
  if (!br_card.trait_roll.is_rolled) {
    await get_new_roll_options(br_card, extra_data, trait_dice, roll_options);
  } else {
    roll_options.modifiers = br_card.trait_roll.modifiers;
    roll_options.rof = br_card.trait_roll.rof;
    get_reroll_options(br_card, extra_data);
  }
  let roll_string = create_roll_string(trait_dice, roll_options.rof);
  // Make penalties red
  for (let mod of roll_options.modifiers) {
    if (mod.value < 0) {
      mod.extra_class = " brsw-red-text";
    }
  }
  // Wild Die
  let wild_die_formula = `+1d${trait_dice["wild-die"].sides}x`;
  if (extra_data.hasOwnProperty("wildDieFormula")) {
    wild_die_formula = extra_data.wildDieFormula;
    if (wild_die_formula.charAt(0) !== "+") {
      wild_die_formula = `+${wild_die_formula}`;
    }
  }
  if ((actor.isWildcard || extra_data.add_wild_die) && wild_die_formula) {
    roll_string += wild_die_formula;
    br_card.trait_roll.wild_die = true;
  } else {
    br_card.trait_roll.wild_die = false;
  }
  br_card.trait_roll.modifiers = roll_options.modifiers;
  let roll = new Roll(roll_string);
  await roll.evaluate();
  await br_card.trait_roll.add_roll(roll);
  if (game.dice3d) {
    await show_3d_dice(br_card, roll);
  }
  await br_card.render();
  await br_card.save();
}

/**
 * Function that exchanges roll when clicked
 * @param event - mouse click event
 * @param {BrCommonCard } br_card - The card to be updated
 */
async function old_roll_clicked(event, br_card) {
  let index = parseInt(event.currentTarget.dataset.index);
  if (index >= br_card.trait_roll.selected_roll_index) {
    index += 1;
  }
  br_card.trait_roll.selected_roll_index = index;
  if (
    br_card.item &&
    !isNaN(parseInt(br_card.item.system.pp)) &&
    br_card.render_data.used_pp
  ) {
    br_card.render_data.used_pp = await discount_pp(
      br_card,
      0,
      br_card.render_data.used_pp,
      0,
    );
  }
  await br_card.render();
  br_card
    .save()
    .catch((err) =>
      console.error("Error while selecting and old roll: " + err),
    );
}

/**
 * Overrides the rolled result of a singular die in a given roll
 * @param {BrCommonCard} br_card
 * @param {int} die_index
 * @param {int, string} new_value
 */
async function override_die_result(br_card, die_index, new_value) {
  br_card.trait_roll.current_roll.dice[die_index].raw_total =
    parseInt(new_value);
  await br_card.trait_roll.current_roll.calculate_results(
    br_card.trait_roll.tn,
    br_card.trait_roll.wild_die,
  );
  await br_card.render();
  await br_card.save();
}

/**
 * Add a modifier to a message
 * @param {BrCommonCard} br_card
 * @param modifier - A {name, value} modifier
 */
async function add_modifier(br_card, modifier) {
  if (modifier.value) {
    let name = modifier.label || game.i18n.localize("BRSW.ManuallyAdded");
    let new_mod = create_modifier(name, modifier.value);
    if (game.dice3d && new_mod.dice) {
      let users = null;
      if (br_card.message.whisper.length > 0) {
        users = br_card.message.whisper;
      }
      await game.dice3d.showForRoll(
        new_mod.dice,
        game.user,
        true,
        users,
        br_card.message.blind,
      );
    }
    new_mod.extra_class = new_mod.value < 0 ? " brsw-red-text" : "";
    br_card.trait_roll.modifiers.push(new_mod);
    await br_card.trait_roll.calculate_results();
    await br_card.render();
    br_card.save().catch(() => {
      console.error("Error saving a card after adding a modifier");
    });
  }
}

/**
 * Deletes a modifier from a message
 * @param {BrCommonCard} br_card
 * @param {int} index - Index of the modifier to delete.
 */
async function delete_modifier(br_card, index) {
  delete br_card.trait_roll.modifiers[index];
  await br_card.trait_roll.calculate_results();
  await br_card.render();
  br_card.save().catch(() => {
    console.error("Error saving a card after deleting a modifier");
  });
}

/**
 * Edits one modifier
 * @param {BrCommonCard} br_card
 * @param {int} index
 * @param {Object} new_modifier
 */
async function edit_modifier(br_card, index, new_modifier) {
  // noinspection JSCheckFunctionSignatures
  let mod_value = parseInt(new_modifier.value);
  if (mod_value) {
    br_card.trait_roll.modifiers[index].label = new_modifier.label;
    br_card.trait_roll.modifiers[index].value = mod_value;
    await br_card.trait_roll.calculate_results();
    await br_card.render();
    br_card.save().catch(() => {
      console.error("Error saving a card after editing a modifier");
    });
  }
}

/**
 * Changes the of one of the rolls.
 *
 * @param {BrCommonCard} br_card
 * @param {int} new_tn
 * @param {string} reason - If it is set the reason will be changed
 */
async function edit_tn(br_card, new_tn, reason) {
  br_card.trait_roll.tn = new_tn;
  if (reason) {
    br_card.trait_roll.tn_reason = reason;
  }
  await br_card.trait_roll.calculate_results();
  await br_card.render();
  br_card.save().catch(() => {
    console.error("Error saving a card after editing a TN");
  });
}

/**
 * Change the TNs of a roll from a token (targeted or selected)
 *
 * @param {BrCommonCard} br_card
 * @param {int} index
 * @param {boolean} selected - True to select targeted, false for selected
 */
function get_tn_from_target(br_card, index, selected) {
  let objetive;
  if (selected) {
    canvas.tokens.controlled.forEach((token) => {
      // noinspection JSUnresolvedVariable
      if (token.actor !== br_card.actor) {
        objetive = token;
      }
    });
  } else {
    objetive = get_targeted_token();
  }
  if (objetive) {
    const origin_token = br_card.token;
    if (origin_token) {
      const target = get_tn_from_token(
        br_card.skill,
        objetive,
        origin_token,
        br_card.item,
      );
      if (target.value) {
        edit_tn(br_card, target.value, target.reason).catch(() => {
          console.error("Error editing TN");
        });
      }
    }
    let tn = { modifiers: [] };
    calculate_distance(origin_token, objetive, br_card.item, tn, br_card.skill);
    br_card.trait_roll.delete_range_modifiers();
    br_card.trait_roll.modifiers = br_card.trait_roll.modifiers.concat(
      tn.modifiers,
    );
    br_card.trait_roll
      .calculate_results()
      .then(br_card.render)
      .then(br_card.save)
      .catch(() => {
        console.log("Can't save card after editing TN");
      });
  }
}

/**
 * Returns true if a token has drawn a joker.
 * @param token_id
 * @return {boolean}
 */
export function has_joker(token_id) {
  let joker = false;
  game.combat?.combatants.forEach((combatant) => {
    if (combatant.token && combatant.token?.id === token_id) {
      joker = combatant.hasJoker;
    }
  });
  return joker;
}

/**
 * Duplicate a message and clean rolls
 * @param {ChatMessage} message
 * @param event - javascript event for click
 */
async function duplicate_message(message, event) {
  let data = duplicate(message);
  // Remove rolls
  data.timestamp = new Date().getTime();
  delete data._id;
  let new_message = await ChatMessage.create(data);
  let br_card = new BrCommonCard(new_message);
  br_card.trait_roll = new TraitRoll();
  br_card.render_data.damage_rolls = [];
  console.log(br_card.render_data);
  await br_card.render();
  await br_card.save();
  const action = get_action_from_click(event);
  if (action.includes("trait")) {
    // noinspection JSUnresolvedVariable
    const br_card = new BrCommonCard(message);
    const card_type = br_card.type;
    if (card_type === BRSW_CONST.TYPE_ATTRIBUTE_CARD) {
      await roll_attribute(br_card, false);
    } else if (card_type === BRSW_CONST.TYPE_SKILL_CARD) {
      await roll_skill(new_message, false);
    } else if (card_type === BRSW_CONST.TYPE_ITEM_CARD) {
      const roll_damage = action.includes("damage");
      await roll_item(br_card, $(br_card.message.content), false, roll_damage);
    }
  }
  return new_message;
}

/**
 * Creates a modifier object to add to a list
 * @param {String} label - Label of the modifier
 * @param {String, Number} expression - A number or a die expression.
 */
export function create_modifier(label, expression) {
  let modifier = { name: label, value: 0, extra_class: "", dice: null };
  if (isNaN(expression)) {
    if (expression.indexOf("d") > 0) {
      // This is a die expression
      modifier.dice = new Roll(expression);
      modifier.dice.evaluate({ async: false });
      modifier.value = parseInt(modifier.dice.result);
    } else {
      modifier.value = eval(expression); // jshint ignore:line
    }
  } else {
    modifier.value = parseInt(expression);
  }
  return modifier;
}

/**
 * Processes actions common to skill and item cards
 */
export function process_common_actions(action, extra_data, macros, actor) {
  let action_name = action.button_name || action.name;
  action_name = action_name.includes("BRSW.")
    ? game.i18n.localize(action_name)
    : action_name;
  // noinspection JSUnresolvedVariable
  if (action.skillMod) {
    let modifier = create_modifier(action_name, action.skillMod);
    if (extra_data.modifiers) {
      extra_data.modifiers.push(modifier);
    } else {
      extra_data.modifiers = [modifier];
    }
  }
  if (action.rerollSkillMod) {
    //Reroll
    extra_data.reroll_modifier = create_modifier(
      action_name,
      action.rerollSkillMod,
    );
  }
  if (action.rof) {
    extra_data.rof = action.rof;
  }
  if (action.dice) {
    extra_data.rof = action.dice;
  }
  if (action.tnOverride) {
    extra_data.tn = action.tnOverride;
    extra_data.tn_reason = action.button_name;
  }
  // noinspection JSUnresolvedVariable
  if (action.self_add_status) {
    // noinspection JSIgnoredPromiseFromCall
    game.succ.addCondition(action.self_add_status, actor);
  }
  if (action.hasOwnProperty("wildDieFormula")) {
    extra_data.wildDieFormula = action.wildDieFormula;
    if (extra_data.wildDieFormula.charAt(0) !== "+") {
      extra_data.wildDieFormula = "+" + extra_data.wildDieFormula;
    }
  }
  if (action.runSkillMacro) {
    macros.push(action.runSkillMacro);
  }
  if (action.type === "macro") {
    macros.push(action.uuid);
  }
  if (action.add_wild_die) {
    extra_data.add_wild_die = true;
  }
}

/**
 * Gets the bigger minimum strength
 * @param actor
 */
function get_actor_armor_minimum_strength(actor) {
  // This should affect only Agility related skills
  const min_str_armors = actor.items.filter((item) => /** equipStatus codes:
   * Weapons:
   * Stored = 0; Carried = 1; Off-Hand = 2; Main Hand = 4; Two Hands = 5
   * All other:
   * Stored = 0; Carried = 1; Equipped = 3
   */ {
    return (
      item.type === "armor" &&
      item.system.minStr &&
      item.system.equipStatus >= 2
    );
  });
  for (let armor of min_str_armors) {
    let penalty = process_minimum_str_modifiers(
      armor,
      actor,
      "BRSW.NotEnoughStrengthArmor",
    );
    if (penalty) {
      return penalty;
    }
  }
}

/**
 * Calculates minimum str modifiers
 * @param item
 * @param actor
 * @param name
 */
export function process_minimum_str_modifiers(item, actor, name) {
  const splited_minStr = item.system.minStr.split("d");
  const min_str_die_size = parseInt(splited_minStr[splited_minStr.length - 1]);
  let new_mod;
  let str_die_size = actor?.system?.attributes?.strength?.die?.sides;
  if (actor?.system?.attributes?.strength.encumbranceSteps) {
    str_die_size += Math.max(
      actor?.system?.attributes?.strength.encumbranceSteps * 2,
      0,
    );
  }
  if (min_str_die_size > str_die_size) {
    // Minimum strength is not meet
    new_mod = create_modifier(
      game.i18n.localize(name),
      -Math.trunc((min_str_die_size - str_die_size) / 2),
    );
  }
  return new_mod;
}
