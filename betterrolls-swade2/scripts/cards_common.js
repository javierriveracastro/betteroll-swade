// Common functions used in all cards
/* globals Token, TokenDocument, ChatMessage, renderTemplate, game, CONST, Roll, canvas, TextEditor, getProperty, duplicate, CONFIG, foundry, setProperty, getDocumentClass, succ, console */
// noinspection JSUnusedAssignment

import {getWhisperData, spendMastersBenny, simple_form, get_targeted_token, broofa} from "./utils.js";
import {discount_pp, get_item_trait, roll_item} from "./item_card.js";
import {get_tn_from_token, roll_skill} from "./skill_card.js";
import {roll_attribute} from "./attribute_card.js";
import {create_unshaken_card, create_unstun_card} from "./remove_status_cards.js";
import {get_gm_modifiers} from './gm_modifiers.js';
import {brAction} from "./actions.js";
import {get_actions} from "./global_actions.js";

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
    this.is_fumble = false
    this.old_rolls = [] // Array with an array of old rolls.
}


/**
 * Stores a flag with the render data, deletes data can't be stored
 *
 * @param {ChatMessage} message
 * @param render_object
 */
async function store_render_flag(message, render_object) {
    for (let property of ['actor', 'skill', 'bennie_avaliable']) {
        delete render_object[property];
    }
    // Get sure thar there is a diff so update socket gets fired.
    if (message.flags?.['betterrolls-swade2']?.render_data) {
        message.flags['betterrolls-swade2'].render_data.update_uid = broofa();
    }
    await message.setFlag('betterrolls-swade2', 'render_data',
        render_object);
}



export class BrCommonCard {

    constructor(message) {
        this.message = message
        this.type = undefined
        this.token_id = undefined
        this.actor_id = undefined
        this.item_id = undefined
        this.skill_id = undefined
        this.target_ids = []
        this.environment = {light: 'bright'}
        this.extra_text = ''
        this.attribute_name = ''  // If this is an attribute card, its name
        this.action_groups = {}
        this.render_data = {}  // Old render data, to be removed
        this.update_list = {} // List of properties pending to be updated
        if (message) {
            const data = this.message.getFlag('betterrolls-swade2', 'br_data')
            if (data) {
                this.load(data)
                console.log("New card loaded from message")
                console.trace()
                // TODO: Check if activate_common_listeners can be made a method of this class and simplified
                // TODO: Reduce card creations.
            }
        } else {
            this.id = broofa()
            this.recover_targets_from_user()
            // TODO: Change targets when rolling a trait
            // TODO: Change targets when rolling damage
            // TODO: Change targets when clicking on the trait result
            // TODO: Change targets when clicking on the damage result
            // TODO: Use the targets from the card data not the current ones
        }
    }

    async save() {
        if (! this.message) {
            await this.create_foundry_message(undefined)
        }
        if (Object.keys(this.update_list).length > 0) {
            this.update_list.id = this.message.id
            this.message.update(this.update_list)
        }
        await this.message.setFlag('betterrolls-swade2', 'br_data', this.get_data())
        // Temporary
        await store_render_flag(this.message, this.render_data)
    }

    /**
    * Prepares the data to be saved
    **/
    get_data() {
        return {type: this.type, token_id: this.token_id,
            actor_id: this.actor_id, item_id: this.item_id,
            skill_id: this.skill_id, environment: this.environment,
            extra_text: this.extra_text, attribute_name: this.attribute_name,
            action_groups: this.action_groups, id: this.id,
            target_ids: this.target_ids}
    }

    load(data){
        const FIELDS = ['id', 'type', 'token_id', 'actor_id', 'item_id',
            'skill_id', 'environment', 'extra_text', 'attribute_name',
            'action_groups', 'target_ids']
        for (let field of FIELDS) {
            this[field] = data[field]
        }
        if (this.message) {
            this.render_data = this.message.getFlag('betterrolls-swade2', 'render_data')
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
        return undefined
    }

    get actor() {
        // We always prefer the token actor if available
        if (this.token_id) {
            const token = this.token
            if (token) {
                // Token can be undefined even with and id the scene is note
                // ready or the token has been removed.
                return token.actor
            }
        }
        if (this.actor_id) {
            return game.actors.get(this.actor_id);
        }
        return undefined
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
            if (Object.hasOwn(trait, 'type') && trait.type === 'skill') {
                this.skill_id = trait.id
            }
            return trait
        }
    }

    get sorted_action_groups() {
        let groups_array = Object.values(this.action_groups)
        return groups_array.sort((a, b) => {return a.name > b.name? 1: -1})
    }

    get targets() {
        const target_array = []
        for (const target_id in this.target_ids) {
            target_array.push(canvas.tokens.get(target_id))
        }
    }

    recover_targets_from_user() {
        this.target_ids = []
        for (const target of game.user.targets) {
            this.target_ids.push(target.id)
        }
    }

    populate_actions() {
        this.action_groups = {}
        this.populate_world_actions()
        if (this.item && !game.settings.get('betterrolls-swade2', 'hide-weapon-actions')) {
            this.populate_item_actions()
        }
        for (const group in this.action_groups) {
            this.action_groups[group].actions.sort(
                (a, b) => {return a.code > b.code? 1: -1})
        }
    }

    populate_world_actions() {
        const item = this.item || this.skill || {type: 'attribute', name: this.attribute_name}
        for (const global_action of get_actions(item, this.actor)) {
            const name = global_action.button_name.slice(0, 5) === "BRSW." ?
                game.i18n.localize(global_action.button_name) : global_action.button_name;
            let group_name = global_action.group || "BRSW.NoGroup"
            let group_name_id = group_name.split('.').join('')
            if (global_action.hasOwnProperty('extra_text')) {
                this.extra_text += global_action.extra_text
            }
            if (!this.action_groups.hasOwnProperty(group_name_id)) {
                const translated_group = game.i18n.localize(group_name)
                this.action_groups[group_name_id] = {
                    name: translated_group, actions: [], id: broofa(),
                    collapsed: game.settings.get('betterrolls-swade2', 'collapse-modifiers')}
            }
            let new_action = new brAction(name, global_action)
            if (global_action.hasOwnProperty('defaultChecked')) {
                new_action.selected = true
            }
            this.action_groups[group_name_id].actions.push(new_action);
        }
    }

    populate_item_actions() {
        let item_actions = []
        for (let action in this.item.system?.actions?.additional) {
            if (this.item.system.actions.additional.hasOwnProperty(action)) {
                let br_action = new brAction(
                    this.item.system.actions.additional[action].name,
                    this.item.system.actions.additional[action])
                item_actions.push(br_action)
            }
        }
        if (item_actions.length) {
            const name = game.i18n.localize("BRSW.ItemActions")
            this.action_groups[name] =
                {name: name, actions: item_actions, id: broofa(),
                 collapsed: game.settings.get('betterrolls-swade2', 'collapse-modifiers')}
        }
    }

    /**
     * Creates an object to store some data in the old render_data flag.
     * @param render_data
     * @param template
     * @returns {*}
     */
    generate_render_data(render_data, template) {
        render_data.bennie_avaliable = are_bennies_available(this.actor);
        render_data.actor = this.actor;
        render_data.result_master_only =
            game.settings.get('betterrolls-swade2', 'result-card') === 'master';
        // Benny image
        render_data.benny_image = game.settings.get('swade', 'bennyImage3DFront') ||
            '/systems/swade/assets/benny/benny-chip-front.png'
        render_data.show_rerolls = game.settings.get('swade', 'dumbLuck') || !render_data.trait_roll?.is_fumble;
        render_data.collapse_results = ! (game.settings.get('betterrolls-swade2', 'expand-results'))
        render_data.collapse_rolls = ! (game.settings.get('betterrolls-swade2', 'expand-rolls'));
        if (template) {
            render_data.template = template;
        }
        this.check_warnings(render_data);
        this.render_data = render_data;
        return render_data;
    }

    /**
     * Recovers the trait used in card
     */
    get_trait() {
        if (this.render_data.hasOwnProperty('trait_id') && this.render_data.trait_id) {
            let trait;
            if (this.render_data.trait_id.hasOwnProperty('name')) {
                // This is an attribute
                trait = this.render_data.trait_id;
            } else {
                // Should be a skill
                trait = this.actor.items.get(this.render_data.trait_id)
            }
            this.render_data.skill = trait
            this.render_data.skill_title = trait ? trait.name + ' ' +
                trait_to_string(trait.system) : '';
        }
    }

    /**
     * Checks and creates a warning in the top of the card
     */
    check_warnings(render_data) {
        if (this.actor.system.status.isStunned) {
            render_data.warning = `<span class="br2-unstun-card brsw-clickable">${game.i18n.localize("BRSW.CharacterIsStunned")}</span>`
        } else if (this.actor.system.status.isShaken) {
            render_data.warning = `<span class="br2-unshake-card brsw-clickable">${game.i18n.localize("BRSW.CharacterIsShaken")}</span>`
        } else if (this.item?.system.actions?.skill.toLowerCase() === game.i18n.localize("BRSW.none").toLowerCase()) {
            render_data.warning = game.i18n.localize("BRSW.NoRollRequired")
        } else if (this.item?.system.quantity <= 0) {
            render_data.warning = game.i18n.localize("BRSW.QuantityIsZero")
        } else {
            render_data.warning = ''
        }
    }

    async render() {
        if (Object.keys(this.action_groups).length === 0) {
            this.populate_actions()
        }
        this.get_trait();
        let new_content = await renderTemplate(this.render_data.template, this.get_data_render());
        TextEditor.enrichHTML(new_content, {async: false});
        if (this.message) {
            this.update_list.content = new_content;
        } else {
            await this.create_foundry_message(new_content)
        }
    }

    /**
     * Temporal stop gap until render_data is removed, and we pass the class
     * to the template
     */
    get_data_render() {
        const data = {...this.get_data(), ...this.render_data,
            ...{sorted_action_groups: this.sorted_action_groups}}
        data.actor = this.actor;
        data.item = this.item;
        data.selected_actions = this.get_selected_actions();
        return data
    }

    /**
     * Change the collapsed status of an action group
     */
    change_action_group_collapsed(group_id, new_status) {
        for (let group in this.action_groups) {
            if (this.action_groups[group].id === group_id) {
                this.action_groups[group].collapsed = new_status
            }
        }
    }

    /**
     * Returns an action from an id
     */
    get_action_from_id(action_id) {
        for (let group in this.action_groups) {
            for (let action of this.action_groups[group].actions) {
                if (action.code.name === action_id) {
                    return action
                }
            }
        }
        return null
    }

    /**
     * Returns the actions currently selected in the card
     */
    get_selected_actions() {
        let selected_actions = []
        for (let group in this.action_groups) {
            for (let action of this.action_groups[group].actions) {
                if (action.selected) {
                    selected_actions.push(action)
                }
            }
        }
        return selected_actions
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
    game.brsw.BrCommonCard = BrCommonCard
}

/**
 * Creates a char card
 *
 * @param {PlaceableObject, SwadeActor} origin The origin of this card
 * @param {object} render_data Data to pass to the render template
 * @param chat_type Type of char message
 * @param {string} template Path to the template that renders this card
 */
export async function create_common_card(origin, render_data, chat_type, template) {
    let actor;
    if (origin instanceof TokenDocument || origin instanceof Token) {
        actor = origin.actor
    } else {
        actor = origin
    }
    let br_message = new BrCommonCard(undefined)
    br_message.actor_id = actor.id
    if (actor !== origin) {
        br_message.token_id = origin.id
    }
    br_message.generate_render_data(render_data, template)
    return br_message
}

/**
* Creates the basic chat data common to most cards
* @param {SwadeActor, Token} origin:  The actor origin of the message
* @return An object suitable to create a ChatMessage
*/
export function create_basic_chat_data(origin){
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
        content: '<p>Default content, likely an error in Better Rolls</p>',
        speaker: {
            actor: actor._idx,
            token: token ? token.id:token,
            alias: origin.name
        },
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        blind: whisper_data.blind,
        flags: {core: {canPopout: true}}
    }
    if (whisper_data.whisper) {
        chatData.whisper = whisper_data.whisper
    }
    chatData.roll = new Roll("0").roll({async:false});
    chatData.rollMode = whisper_data.rollMode;
    // noinspection JSValidateTypes
    return chatData
}


/**
 * Returns true if an actor has bennies available or is master controlled.
 * @param {SwadeActor} actor: The actor that we are checking
 */
export function are_bennies_available(actor) {
    if (actor.hasPlayerOwner) {
        return (actor.system.bennies.value > 0);
    } else if (actor.system.wildcard && actor.system.bennies.value > 0) {
        return true;
    }
    return game.user.getFlag('swade', 'bennies') > 0;
}

/**
 * Expends a bennie
 * @param {SwadeActor} actor: Actor who is going to expend the bennie
 */
export async function spend_bennie(actor){
    // Dice so Nice animation
    if (actor.hasPlayerOwner) {
        await actor.spendBenny();
    } else if (actor.system.wildcard && actor.system.bennies.value > 0) {
        await actor.spendBenny();
    } else {
        await spendMastersBenny();
        if (game.dice3d) {
            const benny = new Roll('1dB').roll({async:false});
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
                    token =canvas.tokens.get(token_id);
                }, 500);
            }
            if (token) {return token.actor}
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
 * @param {HTMLElement} html: html of the card
 */
export function activate_common_listeners(br_card, html) {
    html = $(html)  // Get sure html is a Jquery element
    // The message will be rendered at creation and each time a flag is added
    // Actor will be undefined if this is called before flags are set
    if (br_card.actor){
        // noinspection JSUnresolvedFunction,AnonymousFunctionJS
        html.find('.brws-actor-img').addClass('bound').click(async () => {
            await manage_sheet(br_card.actor)
        });
        //
        html.find('.br2-unshake-card').on('click', ()=>{ // noinspection JSIgnoredPromiseFromCall
            create_unshaken_card(br_card.message, undefined)})
        html.find('.br2-unstun-card').on('click', ()=>{ // noinspection JSIgnoredPromiseFromCall
            create_unstun_card(br_card.message, undefined)})
    }
    html.find('.brsw-selected-actions').on('click', async ev => {
        console.log(ev.currentTarget.dataset)
        console.log(ev.currentTarget)
        game.brsw.dialog.show_card(message);
    })
    // Selectable modifiers
    // noinspection JSUnresolvedFunction
    html.find('.brws-selectable').click(ev => manage_selectable_click(ev, br_card.message));
    // Collapsable fields
    manage_collapsables(html, br_card.message);
    // Old rolls
    // noinspection JSUnresolvedFunction
    html.find('.brsw-old-roll').click(async ev => {
        await old_roll_clicked(ev, br_card.message);
    });
    // Add modifiers
    // noinspection JSUnresolvedFunction
    html.find('.brsw-add-modifier').click(() => {
        const label_mod = game.i18n.localize("BRSW.Modifier");
        simple_form(game.i18n.localize("BRSW.AddModifier"),
            [{id:'label', label: game.i18n.localize("BRSW.Label"),
                    default_value: ''},
                {id: 'value', label: label_mod,
                 default_value: 1}], async values => {
                await add_modifier(br_card.message, {label: values.label,
                    value: values.value});
            });
    })
    // Edit modifiers
    // noinspection JSUnresolvedFunction
    html.find('.brsw-edit-modifier').click((ev) => {
        const label_mod = game.i18n.localize("BRSW.Modifier");
        const {value, label, index} = ev.currentTarget.dataset
        simple_form(game.i18n.localize("BRSW.EditModifier"),
            [{label: 'Label', default_value: label},
                {id: 'value', label: label_mod, default_value: value}],
            async values => {
                await edit_modifier(br_card.message, parseInt(index),
                    {name: values.Label, value: values.value,
                        extra_class: parseInt(values.value) < 0 ? ' brsw-red-text' : ''});
            });
    })
    // Edit die results
    // noinspection JSUnresolvedFunction
    html.find('.brsw-override-die').click((ev) => {
        // Collect roll data
        let roll_data = null;
        let render_data = br_card.message.getFlag('betterrolls-swade2', 'render_data');
        roll_data = render_data.trait_roll;
        // Retrieve additional data
        const die_index = Number(ev.currentTarget.dataset.dieIndex);
        // Show modal
        const label_new_result = game.i18n.localize("BRSW.NewDieResult");
        simple_form(game.i18n.localize("BRSW.EditDieResult"), [
          {label: label_new_result, default_value: 0, id: 'new_result'}],
          async values => {
            const new_value = values.new_result;
            // Actual roll manipulation
            await override_die_result(roll_data, die_index, new_value, false,
                br_card.actor.isWildcard);
            await update_message(br_card.message, render_data);
        });
    })
    // Delete modifiers
    // noinspection JSUnresolvedFunction
    html.find('.brsw-delete-modifier').click(async (ev) => {
        await delete_modifier(br_card.message, parseInt(ev.currentTarget.dataset.index));
    });
    // Edit TNs
    // noinspection JSUnresolvedFunction
    html.find('.brsw-edit-tn').click(async (ev) => {
        const old_tn = ev.currentTarget.dataset.value;
        const index = parseInt(ev.currentTarget.dataset.index);
        const tn_trans = game.i18n.localize("BRSW.TN");
        simple_form(game.i18n.localize("BRSW.EditTN"), [
            {id: 'tn', label: tn_trans, default_value: old_tn}],
            async values => {
                await edit_tn(br_card.message, index, values.tn, "");
        });
    });
    // TNs from target
    // noinspection JSUnresolvedFunction
    html.find('.brsw-target-tn, .brsw-selected-tn').click(ev => {
        const index = ev.currentTarget.dataset.index;
        get_tn_from_target(br_card.message, parseInt(index),
            ev.currentTarget.classList.contains('brsw-selected-tn'));
    })
    // Repeat card
    // noinspection JSUnresolvedFunction
    html.find('.brsw-repeat-card').click((ev) => {
        // noinspection JSIgnoredPromiseFromCall
        duplicate_message(br_card.message, ev);
    })
}


/**
 * Manage collapsable fields
 * @param html
 * @param message: Null if this is called from someplace else than a message
 */
export function manage_collapsables(html, message) {
    let collapse_buttons = html.find('.brsw-collapse-button');
    collapse_buttons.click(async e => {
        e.preventDefault();
        e.stopPropagation();
        let clicked = $(e.currentTarget)
        const data_collapse = clicked.attr('data-collapse');
        const collapsable_span = html.find('.' + data_collapse);
        if (message && data_collapse.slice(0, 11) === 'brsw-action') {
            const collapsed_status = collapsable_span.hasClass('brsw-collapsed')
            const br_card = new BrCommonCard(message)
            br_card.change_action_group_collapsed(data_collapse.slice(13),
                !collapsed_status)
            await br_card.render()
            await br_card.save()
        } else {
            collapsable_span.toggleClass('brsw-collapsed');
            if (collapsable_span.hasClass('brsw-collapsed')) {
                const button = clicked.find('.fas.fa-caret-down');
                button.removeClass('fa-caret-down');
                button.addClass('fa-caret-right');
            } else {
                const button = clicked.find('.fas.fa-caret-right');
                button.removeClass('fa-caret-right');
                button.addClass('fa-caret-down');
            }
        }
    })
}

/**
 * Mark and unmark selectable items
 * @param ev mouse click event
 * @param {ChatMessage} message: The message that contains the selectable item
 */
export async function manage_selectable_click(ev, message){
    ev.preventDefault();
    ev.stopPropagation();
    if (! message || ! ev.currentTarget.dataset.action_id) {
        return manage_html_selectables(ev);
    }
    const br_card = new BrCommonCard(message);
    let action = br_card.get_action_from_id(ev.currentTarget.dataset.action_id)
    action.selected = !action.selected
    await br_card.render()
    await br_card.save()
}

/**
 * Manage selectables not based on cards
 * @param ev
 */
function manage_html_selectables(ev) {
    if (ev.currentTarget.classList.contains('brws-permanent-selected')) {
        ev.currentTarget.classList.remove('brws-permanent-selected')
    } else if (ev.currentTarget.classList.contains('brws-selected')) {
        ev.currentTarget.classList.remove('brws-selected');
    } else {
        ev.currentTarget.classList.add('brws-permanent-selected');
        ev.currentTarget.classList.add('brws-selected');
    }
}

/**
 * Controls the sheet status when the portrait in the header is clicked
 * @param {SwadeActor} actor: The actor instance that created the chat card
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
export function get_action_from_click(event){
    let setting_name = 'click'
    // noinspection JSUnresolvedVariable
    if (event.shiftKey) {
        setting_name = 'shift_click'
    } else {
        // noinspection JSUnresolvedVariable
        if (event.ctrlKey) {
                setting_name = 'ctrl_click'
            } else {
            // noinspection JSUnresolvedVariable
            if (event.altKey) {
                            setting_name = 'alt_click'
                        }
        }
    }
    return game.settings.get('betterrolls-swade2', setting_name)
}


/**
 * Gets the roll options from the card html
 *
 * @param old_options: Options used as default
 */
export function get_roll_options(old_options){
    let modifiers = old_options.additionalMods || [];
    let dmg_modifiers = old_options.dmgMods || [];
    let tn = old_options.tn || 4;
    let tn_reason = old_options.tn_reason || game.i18n.localize("BRSW.Default");
    let rof = old_options.rof || 1;
    // We only check for modifiers when there are no old ones.
    if (! old_options.hasOwnProperty('additionalMods')) {
        $('.brsw-chat-form .brws-selectable.brws-selected').each((_, element) => {
            if (element.dataset.type === 'modifier') {
                modifiers.push(element.dataset.value);
            } else if (element.dataset.type === 'dmg_modifier') {
                dmg_modifiers.push(element.dataset.value);
            } else if (element.dataset.type === 'rof') {
                rof = parseInt(element.dataset.value);
            }
            // Unmark mod
            if (! element.classList.contains('brws-permanent-selected')) {
                element.classList.remove('brws-selected');
            }
        });
        const dice_tray_input = $("input.dice-tray__input")
        let tray_modifier = parseInt(dice_tray_input.val());
        if (tray_modifier) {
            modifiers.push(tray_modifier);
            dice_tray_input.val("0")
        }
    }
    return {additionalMods: modifiers, dmgMods: dmg_modifiers, tn: tn, rof: rof,
        tn_reason: tn_reason}
}


/**
 * Function to convert trait dice and modifiers into a string
 * @param trait
 */
export function trait_to_string(trait) {
    let string = `d${trait.die.sides}`;
    let modifier = parseInt(
        trait.die.modifier);
    if (modifier) {
        string = string + (modifier > 0?"+":"") + modifier;
    }
    return string;
}


async function detect_fumble(remove_die, fumble_possible, result, dice) {
    if (!remove_die && (fumble_possible < 1)) {
        let test_fumble_roll = new Roll('1d6');
        await test_fumble_roll.roll({async: true});
        await test_fumble_roll.toMessage(
            {flavor: game.i18n.localize('BRWS.Testing_fumbles')});
        if (test_fumble_roll.total === 1) {
            return true  // Fumble mark
        }
    } else if (remove_die && (fumble_possible < 0)) {
        // It is only a fumble if the Wild Die is 1
        if (dice[dice.length - 1].results[0] === 1) {
            return true // Fumble mark
        }
    }
    return false;
}

/**
 * Calculates the results of a roll
 * @param {[]} rolls A rolls list see BSWRoll doc
 * @param {boolean} damage True if this is a damage roll
 * @param {boolean} remove_die True to remove a result, that usually means a
 *  trait roll made by a Wild Card
 * @param {Array} dice: The dice array that contains individual dice in a result
 */
export async function calculate_results(rolls, damage, remove_die, dice) {
    let result = 0;
    let minimum_value = 10000000
    let min_position = 0
    let fumble_possible = 0
    for (const [index, roll] of rolls.entries()) {
        fumble_possible += roll.fumble_value
        if (roll.result <= minimum_value) {
            min_position = index
            minimum_value = roll.result
        }
        result = roll.result - roll.tn;
        if (roll.ap) {
            // We have an AP value, add it to the result
            result += Math.min(roll.ap, roll.armor);
        }
        if (result < 0) {
            roll.result_text = game.i18n.localize('BRSW.Failure');
            roll.result_icon = '<i class="brsw-red-text fas fa-minus-circle"></i>'
        } else if (result < 4) {
            if (damage) {
                roll.result_text = game.i18n.localize('BRSW.Shaken');
                roll.result_icon = '<i class="brsw-blue-text fas fa-certificate"></i>'
            } else {
                roll.result_text = game.i18n.localize('BRSW.Success');
                roll.result_icon = '<i class="brsw-blue-text fas fa-check"></i>'
            }
        } else if(result < 8) {
            if (damage) {
                roll.result_text = game.i18n.localize('BRSW.Wound');
                roll.result_icon = '<i class="brsw-red-text fas fa-tint"></i>'
            } else {
                roll.result_text = game.i18n.localize('BRSW.Raise');
                roll.result_icon = '<i class="brsw-blue-text fas fa-check-double"></i>'
            }
        } else {
            const raises = Math.floor(result / 4)
            if (damage) {
                roll.result_text =
                    game.i18n.localize('BRSW.Wounds') + ' ' + raises;
                roll.result_icon = raises.toString() + ' ' +
                    '<i class="brsw-red-text fas fa-tint"></i>';
            } else {
                roll.result_text = game.i18n.localize(
                    'BRSW.Raise_plural') + ' ' + raises;
                roll.result_icon = raises.toString() +
                    '<i class="brsw-blue-text fas fa-check-double"></i>';
            }
        }
    }
    // Remove lower die.
    if (remove_die && dice.length) {
        rolls[min_position].extra_class += ' brsw-discarded-roll';
        rolls[min_position].tn = 0;
        dice[min_position].extra_class += ' brsw-discarded-roll';
        dice[dice.length - 1].label = game.i18n.localize("SWADE.WildDie");
    }
    if (result < 0) {
        result = 0
    } else if (result === 0) {
        result = 0.01  // Ugly hack to differentiate from failure
    }
    if (!damage) {
        return await detect_fumble(remove_die, fumble_possible, result, dice);
    }
    return result
}

/**
 * Removes the class that marks a die as discarded from a die array
 * @param dice
 * @param rolls
 */
function remove_discarded_die_mark(dice, rolls) {
    // Because of some bright day idea we use tn = 0 to mark a discarded die
    // So now we need this ugly hack to undo it
    let tn = 0
    for (const roll of rolls) {
        if (roll.tn > tn) {tn = roll.tn}
    }
    for (const roll of rolls) {
        roll.extra_class = roll.extra_class.replace(/ brsw-discarded-roll/g, '')
        roll.extra_class = roll.extra_class.replace(/ brsw-red-text/g, '')
        roll.extra_class = roll.extra_class.replace(/ brsw-blue-text/g, '')
        roll.tn = tn
    }
    for (const roll of dice) {
        roll.extra_class = roll.extra_class.replace(/ brsw-discarded-roll/g, '')
        roll.extra_class = roll.extra_class.replace(/ brsw-red-text/g, '')
    }
}

/**
 * Updates a message using a new render_data
 * @param {ChatMessage} message
 * @param render_data
 */
export async function update_message(message, render_data) {
    const br_message = new BrCommonCard(message)
    if (br_message.type ===
            BRSW_CONST.TYPE_ITEM_CARD) {
        render_data.skill = get_item_trait(br_message.item, br_message.actor);
    }
    br_message.generate_render_data(render_data, undefined)
    await br_message.render()
    await br_message.save()
}


/**
 * Checks and rolls convictions
 * @param {SwadeActor }actor
 * @return: Modifiers Array
 */
export function check_and_roll_conviction(actor) {
    let conviction_modifier;
    if (actor.isWildcard &&
        game.settings.get('swade', 'enableConviction') &&
            getProperty(actor.system, 'details.conviction.active')) {
        let conviction_roll = new Roll('1d6x');
        conviction_roll.roll({async: false});
        // noinspection JSIgnoredPromiseFromCall
        conviction_roll.toMessage(
            {flavor: game.i18n.localize('BRSW.ConvictionRoll')});
        conviction_modifier = create_modifier(
            game.i18n.localize('SWADE.Conv'), conviction_roll.total)
    }
    return conviction_modifier
}


function get_below_chat_modifiers(options, roll_options) {
    // Betterrolls modifiers
    options.additionalMods.forEach(mod => {
        const mod_value = parseInt(mod);
        roll_options.modifiers.push(create_modifier('Better Rolls', mod_value))
        roll_options.total_modifiers += mod_value;
    })
    // Master Modifiers
    const master_modifiers = get_gm_modifiers()
    if (master_modifiers) {
        roll_options.modifiers.push(create_modifier(
            game.i18n.localize("BRSW.GMModifier"), master_modifiers))
        roll_options.total_modifiers += master_modifiers
    }
}

function get_actor_own_modifiers(actor, roll_options) {
    // Wounds
    const woundPenalties = actor.calcWoundPenalties();
    if (woundPenalties !== 0) {
        roll_options.modifiers.push(create_modifier(
            game.i18n.localize('SWADE.Wounds'), woundPenalties))
        roll_options.total_modifiers += woundPenalties;
    }
    // Fatigue
    const fatiguePenalties = actor.calcFatiguePenalties();
    if (fatiguePenalties !== 0) {
        roll_options.modifiers.push(create_modifier(
            game.i18n.localize('SWADE.Fatigue'), fatiguePenalties))
        roll_options.total_modifiers += fatiguePenalties;
    }
    // Wounds or Fatigue ignored
    if (actor.system.woundsOrFatigue.ignored) {
        const ignored = Math.min(
            parseInt(actor.system.woundsOrFatigue.ignored) || 0,
            - fatiguePenalties - woundPenalties);
        if (ignored) {
            roll_options.modifiers.push(create_modifier(
                game.i18n.localize('BRSW.WoundsOrFatigueIgnored'), ignored))
            roll_options.total_modifiers += ignored;
        }
    }
    // Own status
    const statusPenalties = actor.calcStatusPenalties();
    if (statusPenalties !== 0) {
        roll_options.modifiers.push(create_modifier(
            game.i18n.localize('SWADE.Status'), statusPenalties))
        roll_options.total_modifiers += statusPenalties;
    }
}

/**
 * Get all the options needed for a new roll
 * @param {ChatMessage} message
 * @param extra_data
 * @param html
 * @param trait_dice
 * @param roll_options: An object with the current roll_options
 */
async function get_new_roll_options(message, extra_data, html, trait_dice, roll_options) {
    let extra_options = {}
    let br_card = new BrCommonCard(message)
    let objetive = get_targeted_token();
    if (!objetive) {
        canvas.tokens.controlled.forEach(token => {
            // noinspection JSUnresolvedVariable
            if (token.actor !== br_card.actor) {
                objetive = token;
            }
        })
    }
    if (objetive && br_card.skill) {
        const origin_token = br_card.token
        if (origin_token) {
            const target_data = get_tn_from_token(
                br_card.skill, objetive, origin_token, br_card.item);
            extra_options.tn = target_data.value;
            extra_options.tn_reason = target_data.reason;
            extra_options.target_modifiers = target_data.modifiers;
        }
    }
    if (extra_data.hasOwnProperty('tn')) {
        extra_options.tn = extra_data.tn;
        extra_options.tn_reason = extra_data.tn_reason.slice(0, 20);
    }
    if (extra_data.hasOwnProperty('rof')) {
        extra_options.rof = extra_data.rof;
    }
    let options = get_roll_options(extra_options);
    roll_options.rof = options.rof || 1;
    // Trait modifier
    if (parseInt(trait_dice.die.modifier)) {
        const mod_value = parseInt(trait_dice.die.modifier)
        roll_options.modifiers.push(create_modifier(
            game.i18n.localize("BRSW.TraitMod"), mod_value))
        roll_options.total_modifiers += mod_value;
    }
    get_below_chat_modifiers(options, roll_options);
    get_actor_own_modifiers(br_card.actor, roll_options);
    // Armor min str
    if (br_card.skill?.system.attribute === 'agility') {
        let armor_penalty = get_actor_armor_minimum_strength(br_card.actor)
        if (armor_penalty) {
            roll_options.total_modifiers += armor_penalty.value
            roll_options.modifiers.push(armor_penalty)
        }
    }
    // Target Mods
    if (extra_options.target_modifiers) {
        extra_options.target_modifiers.forEach(modifier => {
            roll_options.total_modifiers += modifier.value;
            roll_options.modifiers.push(modifier);
        })
    }
    // Action mods
    const br_message = new BrCommonCard(message)
    if (br_message.type ===
        BRSW_CONST.TYPE_ITEM_CARD) {
        if (br_message.item.system.actions.skillMod) {
            let modifier_value = 0
            if (isNaN(br_message.item.system.actions.skillMod)) {
                const temp_roll = new Roll(br_message.item.system.actions.skillMod)
                modifier_value = (await temp_roll.evaluate()).total
            } else {
                modifier_value = parseInt(br_message.item.system.actions.skillMod)
            }
            let new_mod = create_modifier(game.i18n.localize("BRSW.ItemMod"), modifier_value)
            roll_options.modifiers.push(new_mod)
            roll_options.total_modifiers += new_mod.value
        }
    }
    // Options set from card
    if (extra_data.modifiers) {
        extra_data.modifiers.forEach(modifier => {
            roll_options.modifiers.push(modifier);
            roll_options.total_modifiers += modifier.value;
        })
    }
    //Conviction
    const conviction_modifier = check_and_roll_conviction(br_card.actor);
    if (conviction_modifier) {
        roll_options.modifiers.push(conviction_modifier);
        roll_options.total_modifiers += conviction_modifier.value
    }
    // Joker
    if (br_card.token && has_joker(br_card.token.id)) {
        roll_options.modifiers.push(create_modifier('Joker', 2))
        roll_options.total_modifiers += 2;
    }
    // Encumbrance
    const render_data = message.getFlag('betterrolls-swade2', 'render_data');
    if (br_card.actor.isEncumbered) {
        if (render_data.attribute_name === 'agility') {
            roll_options.modifiers.push({name: game.i18n.localize('SWADE.Encumbered'),
                value: -2})
            roll_options.total_modifiers -= 2
        } else {
            const skill = br_card.actor.items.get(render_data.trait_id)
            if (skill && skill.system.attribute === 'agility') {
                roll_options.modifiers.push({name: game.i18n.localize('SWADE.Encumbered'),
                    value: -2})
                roll_options.total_modifiers -= 2
            }
        }
    }
    return options;
}

/**
 * Get the options for a reroll
 */
function get_reroll_options(actor, render_data, roll_options, extra_data,) {
    // Reroll, keep old options
    roll_options.rof = actor.isWildcard ? render_data.trait_roll.rolls.length - 1 : render_data.trait_roll.rolls.length;
    roll_options.modifiers = render_data.trait_roll.modifiers;
    let reroll_mods_applied = false;
    roll_options.modifiers.forEach(mod => {
        roll_options.total_modifiers += mod.value
        if (mod.name.includes('(reroll)')) {
            reroll_mods_applied = true;
        }
    });
    if (extra_data.reroll_modifier && !reroll_mods_applied) {
        roll_options.modifiers.push(create_modifier(
            `${extra_data.reroll_modifier.name} (reroll)`,
            extra_data.reroll_modifier.value))
        roll_options.total_modifiers += extra_data.reroll_modifier.value;
    }
    let options = {}
    render_data.trait_roll.rolls.forEach(roll => {
        if (roll.tn) {
            // We hacky use tn = 0 to mark discarded dice,
            // here we pay for it
            options = {
                tn: roll.tn,
                tn_reason: roll.tn_reason
            };
        }
    });
    render_data.trait_roll.old_rolls.push(
        render_data.trait_roll.rolls);
    render_data.trait_roll.rolls = [];
    return options;
}

async function show_3d_dice(roll, message, modifiers, wild_die) {
    if (wild_die) {
        set_wild_die_theme(roll.dice[roll.dice.length - 1]);
    }
    let users = null;
    if (message.whisper.length > 0) {
        users = message.whisper;
    }
    const blind = message.blind
    // Dice buried in modifiers.
    for (let modifier of modifiers) {
        if (modifier.dice && (modifier.dice instanceof Roll)) {
            // noinspection ES6MissingAwait
            game.dice3d.showForRoll(modifier.dice, game.user, true, users, blind)
        }
    }
    await game.dice3d.showForRoll(roll, game.user, true, users, blind);
}

function set_wild_die_theme(wildDie) {
    const dieSystem = game.user.getFlag('swade', 'dsnWildDiePreset') || 'none';
    if (!dieSystem || dieSystem === 'none') {
        return;
    }
    const colorSet = game.user.getFlag('swade', 'dsnWildDie') || "none";
    if (colorSet === 'customWildDie') {
        // Build the custom appearance and set it
        const customColors = game.user.getFlag('swade', 'dsnCustomWildDieColors');
        const customOptions = game.user.getFlag('swade', 'dsnCustomWildDieOptions');
        const customAppearance = {
            colorset: 'custom',
            foreground: customColors?.labelColor,
            background: customColors?.diceColor,
            edge: customColors?.edgeColor,
            outline: customColors?.outlineColor,
            font: customOptions?.font,
            material: customOptions?.material,
            texture: customOptions?.texture,
            system: dieSystem,
        };
        setProperty(wildDie, 'options.appearance', customAppearance);
    }
    else {
        // Set the preset
        setProperty(wildDie, 'options.colorset', colorSet);
        setProperty(wildDie, 'options.appearance.system', dieSystem);
    }
    // Get the dicePreset for the given die type
    const dicePreset = game.dice3d?.DiceFactory.systems[dieSystem].dice.find((d) => d.type === 'd' + wildDie.faces);
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
    let roll_string = `1d${trait_dice.die.sides}x`
    // @zk-sn: If roll is a 1d1x (example: Strength score of 1), change it to 1d1 to prevent exploding die recursion.  (Fix for #211)
    if (roll_string === `1d1x`) {
        roll_string = `1d1`;
        for (let i = 0; i < (rof - 1); i++) {
            roll_string += `+1d${trait_dice.die.sides}`;
        }
    } else {
        for (let i = 0; i < (rof - 1); i++) {
            roll_string += `+1d${trait_dice.die.sides}x`
        }
    }
    return roll_string;
}

/**
 * Makes a roll trait
 * @param message
 * @param trait_dice An object representing a trait dice
 * @param dice_label: Label for the trait die
 * @param {string} html: Html to be parsed for extra options.
 * @param extra_data: Extra data to add to render options
 */
export async function roll_trait(message, trait_dice, dice_label, html, extra_data) {
    const br_card = new BrCommonCard(message);
    let {render_data, actor} = br_card;
    let roll_options = {total_modifiers: 0, modifiers: [], rof: undefined}
    let options;
    if (!render_data.trait_roll.rolls.length) {
        options = await get_new_roll_options(message, extra_data, html, trait_dice, roll_options);
    } else {
        options = get_reroll_options(actor, render_data, roll_options, extra_data);
    }
    render_data.trait_roll.is_fumble = false;
    let trait_rolls = [];
    let dice = [];
    let roll_string = create_roll_string(trait_dice, roll_options.rof);
    // Make penalties red
    for (let mod of roll_options.modifiers) {
        if (mod.value < 0) {
            mod.extra_class = ' brsw-red-text'
        }
    }
    // Wild Die
    let wild_die_formula = `+1d${trait_dice['wild-die'].sides}x`;
    if (extra_data.hasOwnProperty('wildDieFormula')) {
        wild_die_formula = extra_data.wildDieFormula;
        if (wild_die_formula.charAt(0) !== '+') {
            wild_die_formula = `+${wild_die_formula}`;
        }
    }
    if ((actor.isWildcard || extra_data.add_wild_die) && wild_die_formula) {
        roll_string += wild_die_formula;
    }
    let roll = new Roll(roll_string);
    roll.evaluate({async:false})
    let index = 0
    roll.terms.forEach((term) => {
        if (term.hasOwnProperty('faces')) {
            // Results
            let extra_class = '';
            let fumble_possible = 1;
            if (term.total === 1) {
                extra_class = ' brsw-red-text';
                fumble_possible -= 2;
            } else if (term.total > term.faces) {
                extra_class = ' brsw-blue-text';
            }
            trait_rolls.push({sides: term.faces, fumble_value: fumble_possible,
                result: term.total + roll_options.total_modifiers, extra_class: extra_class,
                tn: options.tn, tn_reason: options.tn_reason});
            // Dies
            let new_die = {faces: term.faces, results: [], label: dice_label,
                extra_class: ''};
            term.results.forEach(result => {
                new_die.results.push(result.result);
            })
            dice.push(new_die);
            index += 1;
        }
    })
    if (game.dice3d) {
        await show_3d_dice(roll, message, roll_options.modifiers,
            (actor.isWildcard || extra_data.add_wild_die) && wild_die_formula);
    }
    render_data.trait_roll.is_fumble = await calculate_results(
        trait_rolls, false, actor.isWildcard, dice)
    render_data.trait_roll.rolls = trait_rolls;
    render_data.trait_roll.modifiers = roll_options.modifiers;
    render_data.trait_roll.dice = dice;
    for (let key in extra_data) {
        if (extra_data.hasOwnProperty(key)) {
            render_data[key] = extra_data[key];

        }
    }
    await update_message(message, render_data)
    return render_data.trait_roll;
}

/**
 * Function that exchanges roll when clicked
 * @param event: mouse click event
 * @param message:
 */
async function old_roll_clicked(event, message) {
    const index = event.currentTarget.dataset.index;
    const br_card = new BrCommonCard(message);
    let render_data = message.getFlag('betterrolls-swade2', 'render_data');
    render_data.trait_roll.old_rolls.push(render_data.trait_roll.rolls);
    render_data.trait_roll.rolls = render_data.trait_roll.old_rolls[index];
    delete render_data.trait_roll.old_rolls[index];
    // Recreate die
    let total_modifier = 0;
    render_data.trait_roll.modifiers.forEach(mod => {
        total_modifier += mod.value;
    })
    render_data.trait_roll.dice.forEach((die, index) => {
        die.results = [];
        let final_result = render_data.trait_roll.rolls[index].result - total_modifier;
        for (let number = final_result; number > 0; number -= die.faces) {
            die.results.push(number > die.faces ? die.faces : number);
        }
    })
    if (br_card.item) {
        render_data.skill = get_item_trait(br_card.item, br_card.actor);
        if (!isNaN(parseInt(br_card.item.system.pp)) && render_data.used_pp) {
            render_data.used_pp = await discount_pp(
                br_card, render_data.trait_roll.rolls, 0, render_data.used_pp, 0);
    }

    }
    await update_message(message, render_data);
}


/**
 * Updates the total results of an old stored rolls in a value
 * @param trait_roll
 * @param mod_value
 */
async function update_roll_results(trait_roll, mod_value) {
    let wild_die = false
    trait_roll.rolls.forEach(roll => {
        roll.result += mod_value;
        if (roll.extra_class === ' brsw-discarded-roll') {
            wild_die = true;
        }
    });
    trait_roll.is_fumble = await calculate_results(
        trait_roll.rolls, false, wild_die, [])
    for (const old_roll of trait_roll.old_rolls) {
        for (const roll of old_roll) {
            roll.result += mod_value;
        }
        trait_roll.is_fumble = await calculate_results(
            old_roll, false, wild_die, [])
    }
}


/**
 * Overrides the rolled result of a singular die in a given roll
 * @param roll_data
 * @param {int} die_index
 * @param {int, string} new_value
 * @param {boolean} [is_damage_roll=false]
 * @param {boolean} is_wildcard
 */
async function override_die_result(roll_data, die_index, new_value, is_damage_roll = false, is_wildcard = false) {
    let total_modifier = 0
    roll_data.modifiers.forEach(mod => {
        if (mod) {
            total_modifier += mod.value;
        }
    })
    roll_data.rolls[die_index].result = parseInt(new_value) + total_modifier
    /* Recreate die*/
    roll_data.dice.forEach((die, index) => {
        die.results = [];
        let final_result = roll_data.rolls[index].result - total_modifier;
        for (let number = final_result; number > 0; number -= die.faces) {
            die.results.push(number > die.faces ? die.faces : number);
        }
    })
    remove_discarded_die_mark(roll_data.dice, roll_data.rolls)
    await calculate_results(roll_data.rolls, is_damage_roll, is_wildcard, roll_data.dice);
}


/**
 * Add a modifier to a message
 * @param {ChatMessage} message
 * @param modifier: A {name, value} modifier
 */
async function add_modifier(message, modifier) {
    let render_data = message.getFlag('betterrolls-swade2', 'render_data');
    if (modifier.value) {
        let name = modifier.label || game.i18n.localize("BRSW.ManuallyAdded");
        let new_mod = create_modifier(name, modifier.value)
        if (game.dice3d && new_mod.dice) {
            let users = null;
            if (message.whisper.length > 0) {
                users = message.whisper;
            }
            await game.dice3d.showForRoll(new_mod.dice, game.user, true, users, message.blind);
        }
        new_mod.extra_class = new_mod.value < 0 ? ' brsw-red-text' : ''
        render_data.trait_roll.modifiers.push(new_mod)
        await update_roll_results(render_data.trait_roll, new_mod.value);
        await update_message(message, render_data);
    }
}

/**
 * Deletes a modifier from a message
 * @param {ChatMessage} message
 * @param {int} index: Index of the modifier to delete.
 */
async function delete_modifier(message, index) {
    let render_data = message.getFlag('betterrolls-swade2', 'render_data');
    let modifier = render_data.trait_roll.modifiers[index];
    await update_roll_results(render_data.trait_roll, - modifier.value);
    delete render_data.trait_roll.modifiers[index]
    await update_message(message, render_data);
}


/**
 * Edits one modifier
 * @param {ChatMessage} message
 * @param {int} index
 * @param {Object} new_modifier
 */
async function edit_modifier(message, index, new_modifier) {
    // noinspection JSCheckFunctionSignatures
    let mod_value = parseInt(new_modifier.value);
    if (mod_value) {
        let render_data = message.getFlag('betterrolls-swade2', 'render_data');
        const modifier = render_data.trait_roll.modifiers[index];
        const difference = mod_value - modifier.value;
        new_modifier.value = mod_value;
        render_data.trait_roll.modifiers[index] = new_modifier;
        await update_roll_results(render_data.trait_roll, difference);
        await update_message(message, render_data);
    }
}


/**
 * Changes the of one of the rolls.
 *
 * @param {ChatMessage} message
 * @param {int} index: -1 to update all tns
 * @param {int} new_tn
 * @param {string} reason: If it is set the reason will be changed
 */
async function edit_tn(message, index, new_tn, reason) {
    let render_data = message.getFlag('betterrolls-swade2', 'render_data');
    if (index >= 0) {
        render_data.trait_roll.rolls[index].tn = new_tn;
        if (reason) {
            render_data.trait_roll.rolls[index].tn_reason = reason;
        }
    } else {
        render_data.trait_roll.rolls.forEach(roll => {
            if (roll.tn) {
                roll.tn = new_tn;
                if (reason) {
                    roll.tn_reason = reason;
                }
            }
        });
    }
    await update_roll_results(render_data.trait_roll, 0);
    await update_message(message, render_data)
}


/**
 * Change the TNs of a roll from a token (targeted or selected)
 *
 * @param {ChatMessage} message
 * @param {int} index
 * @param {boolean} selected: True to select targeted, false for selected
 */
function get_tn_from_target(message, index, selected) {
    let objetive;
    const br_card = new BrCommonCard(message)
    if (selected) {
        canvas.tokens.controlled.forEach(token => {
            // noinspection JSUnresolvedVariable
            if (token.actor !== br_card.actor) {
                objetive = token;
            }
        });
    } else {
        objetive = get_targeted_token();
    }
    if (objetive) {
        const origin_token = br_card.token
        if (origin_token) {
            const target = get_tn_from_token(br_card.skill, objetive, origin_token, br_card.item);
            if (target.value) {
                // Don't update if we didn't get a value
                // noinspection JSIgnoredPromiseFromCall
                edit_tn(message, index, target.value, target.reason)
            }
        }
    }
}

/**
 * Returns true if a token has drawn a joker.
 * @param token_id
 * @return {boolean}
 */
export function has_joker(token_id) {
    let joker = false;
    game.combat?.combatants.forEach(combatant => {
        if (combatant.token && combatant.token?.id === token_id) {
            joker = combatant.hasJoker
        }
    });
    return joker;
}


/**
 * Duplicate a message and clean rolls
 * @param {ChatMessage} message
 * @param event: javascript event for click
 */
async function duplicate_message(message, event) {
    let data = duplicate(message);
    // Remove rolls
    data.timestamp = new Date().getTime();
    data.flags['betterrolls-swade2'].render_data.trait_roll = new BRWSRoll();
    data.flags['betterrolls-swade2'].render_data.damage_rolls = [];
    delete data._id;
    let new_message = await ChatMessage.create(data);
    await update_message(new_message, data.flags['betterrolls-swade2'].render_data);
    const action = get_action_from_click(event);
    if (action.includes('trait')) {
        // noinspection JSUnresolvedVariable
        const card_type = new BrCommonCard(message).type
        if (card_type === BRSW_CONST.TYPE_ATTRIBUTE_CARD) {
            await roll_attribute(new_message, $(message.content), false);
        } else if (card_type === BRSW_CONST.TYPE_SKILL_CARD) {
            await roll_skill(new_message, $(message.content), false);
        } else if (card_type === BRSW_CONST.TYPE_ITEM_CARD) {
            const roll_damage = action.includes('damage')
            await roll_item(new_message, $(message.content), false,
                roll_damage);
        }
    }
    return new_message
}

/**
 * Creates a modifier object to add to a list
 * @param {String} label: Label of the modifier
 * @param {String, Number} expression: A number or a die expression.
 */
export function create_modifier(label, expression) {
    let modifier = {name: label, value: 0, extra_class: '', dice: null}
    if (isNaN(expression)) {
        if (expression.indexOf('d') > 0) {
            // This is a die expression
            modifier.dice = new Roll(expression)
            modifier.dice.evaluate({async:false})
            modifier.value = parseInt(modifier.dice.result)
        } else {
            modifier.value = eval(expression) // jshint ignore:line
        }
    } else {
        modifier.value = parseInt(expression)
    }
    return modifier
}


/**
 * Processes actions common to skill and item cards
 */
export function process_common_actions(action, extra_data, macros, actor) {
    let action_name = action.button_name || action.name
    action_name = action_name.includes("BRSW.") ? game.i18n.localize(action_name) : action_name
    // noinspection JSUnresolvedVariable
    if (action.skillMod) {
        let modifier = create_modifier(action_name, action.skillMod)
        if (extra_data.modifiers) {
            extra_data.modifiers.push(modifier);
        } else {
            extra_data.modifiers = [modifier];
        }
    }
    if (action.rerollSkillMod) {
        //Reroll
        extra_data.reroll_modifier = create_modifier(action_name, action.rerollSkillMod)
    }
    if (action.rof) {
        extra_data.rof = action.rof;
    }
    if (action.tnOverride) {
        extra_data.tn = action.tnOverride
        extra_data.tn_reason = action.button_name
    }
    // noinspection JSUnresolvedVariable
    if (action.self_add_status) {
        // noinspection JSIgnoredPromiseFromCall
        game.succ.addCondition(action.self_add_status, actor)
    }
    if (action.hasOwnProperty('wildDieFormula')) {
        extra_data.wildDieFormula = action.wildDieFormula;
        if (extra_data.wildDieFormula.charAt(0) !== '+') {
            extra_data.wildDieFormula = '+' + extra_data.wildDieFormula
        }
    }
    if (action.runSkillMacro) {
        macros.push(action.runSkillMacro);
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
    const min_str_armors = actor.items.filter((item) =>
        /** equipStatus codes:
         * Weapons:
         * Stored = 0; Carried = 1; Off-Hand = 2; Main Hand = 4; Two Hands = 5
         * All other:
         * Stored = 0; Carried = 1; Equipped = 3
         */
        {return item.type === 'armor' && item.system.minStr && item.system.equipStatus >= 2})
    for (let armor of min_str_armors) {
        let penalty = process_minimum_str_modifiers(armor, actor, "BRSW.NotEnoughStrengthArmor")
        if (penalty) {
            return  penalty
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
    const splited_minStr = item.system.minStr.split('d')
    const min_str_die_size = parseInt(splited_minStr[splited_minStr.length - 1])
    let new_mod
    let str_die_size = actor?.system?.attributes?.strength?.die?.sides
    if (actor?.system?.attributes?.strength.encumbranceSteps) {
        str_die_size += Math.max(actor?.system?.attributes?.strength.encumbranceSteps * 2, 0)
    }
    if (min_str_die_size > str_die_size) {
        // Minimum strength is not meet
        new_mod = create_modifier(game.i18n.localize(name),
            -Math.trunc((min_str_die_size - str_die_size) / 2))
    }
    return new_mod
}
