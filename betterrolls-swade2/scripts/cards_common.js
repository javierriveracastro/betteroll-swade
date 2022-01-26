// Common functions used in all cards
/* globals Token, TokenDocument, ChatMessage, renderTemplate, game, CONST, Roll, canvas, TextEditor, getProperty, duplicate*/
// noinspection JSUnusedAssignment

import {getWhisperData, spendMastersBenny, simple_form, get_targeted_token, broofa} from "./utils.js";
import {get_item_from_message, get_item_trait, roll_item} from "./item_card.js";
import {get_tn_from_token, roll_skill} from "./skill_card.js";
import {roll_attribute} from "./attribute_card.js";

export const BRSW_CONST = {
    TYPE_ATTRIBUTE_CARD: 1,
    TYPE_SKILL_CARD: 2,
    TYPE_ITEM_CARD: 3,
    TYPE_DMG_CARD: 10,
    TYPE_INC_CARD: 11,
    TYPE_INJ_CARD: 12,
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
 * @param message
 * @param render_object
 */
async function store_render_flag(message, render_object) {
    for (let property of ['actor', 'skill', 'bennie_avaliable']) {
        delete render_object[property];
    }
    // Get sure thar there is a diff so update socket gets fired.
    if (message.data.flags?.['betterrolls-swade2']?.render_data) {
        message.data.flags['betterrolls-swade2'].render_data.update_uid = broofa();
    }
    await message.setFlag('betterrolls-swade2', 'render_data',
        render_object);
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
    let render_object = create_render_options(
        actor, render_data, template)
    let chatData = create_basic_chat_data(origin, chat_type);
    chatData.content = await renderTemplate(template, render_object);
    let message = await ChatMessage.create(chatData);
    // Remove actor to store the render data.
    await store_render_flag(message, render_object);
    await message.setFlag('betterrolls-swade2', 'actor',
            actor.id)
    if (actor !== origin) {
        // noinspection JSUnresolvedVariable
        await message.setFlag('betterrolls-swade2', 'token',
            origin.id)
    }
    return message
}

/**
* Creates the basic chat data common to most cards
* @param {SwadeActor, Token} origin:  The actor origin of the message
* @param {int, string} type: The type of message
* @return An object suitable to create a ChatMessage
*/
export function create_basic_chat_data(origin, type){
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
        type: type,
        blind: whisper_data.blind
    }
    if (whisper_data.whisper) {
        chatData.whisper = whisper_data.whisper
    }
    if (type === CONST.CHAT_MESSAGE_TYPES.ROLL) {
        chatData.roll = new Roll("0").roll({async:false});
        chatData.rollMode = whisper_data.rollMode;
    }
    // noinspection JSValidateTypes
    return chatData
}


/**
 * Creates de common render options for all the cards
 * @param {SwadeActor} actor
 * @param {object} render_data: options for this card
 * @para item: An item object
 * @param {string} template:
 */
export function create_render_options(actor, render_data, template) {
    render_data.bennie_avaliable = are_bennies_available(actor);
    render_data.actor = actor;
    render_data.result_master_only =
        game.settings.get('betterrolls-swade2', 'result-card') === 'master';
        // Benny image
    render_data.benny_image = game.settings.get('swade', 'bennyImage3DFront') ||
        '/systems/swade/assets/benny/benny-chip-front.png'
    render_data.show_rerolls = !(game.settings.get('betterrolls-swade2', 'hide-reroll-fumble') && render_data.trait_roll?.is_fumble);
    render_data.collapse_results = ! (game.settings.get('betterrolls-swade2', 'expand-results'))
    render_data.collapse_rolls = ! (game.settings.get('betterrolls-swade2', 'expand-rolls'));
    if (template) {
        render_data.template = template;
    }
    // Retrieve object from ids.
    if (render_data.hasOwnProperty('trait_id') && render_data.trait_id) {
        let trait;
        if (render_data.trait_id.hasOwnProperty('name')) {
            // This is an attribute
            trait = render_data.trait_id;
        } else {
            // Should be a skill
            trait = actor.items.get(render_data.trait_id)
        }
        render_data.skill = trait
        render_data.skill_title = trait ? trait.name + ' ' +
            trait_to_string(trait.data.data) : '';
    }
    render_data.warning =
        (actor.data.data.status.isStunned || actor.data.data.status.isShaken) ?
        game.i18n.localize("BRSW.CharacterIsShaken") :
        ''
    return render_data;
}


/**
 * Returns true if an actor has bennies available or is master controlled.
 * @param {SwadeActor} actor: The actor that we are checking
 */
export function are_bennies_available(actor) {
    if (actor.hasPlayerOwner) {
        return (actor.data.data.bennies.value > 0);
    } else if (actor.data.data.wildcard && actor.data.data.bennies.value > 0) {
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
    } else if (actor.data.data.wildcard && actor.data.data.bennies.value > 0) {
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
 * Get the actor from the message flag
 * @param {ChatMessage} message
 * @returns {actor|null|*}
 */
export function get_actor_from_message(message){
    return get_actor_from_ids(
        message.getFlag('betterrolls-swade2', 'token'),
        message.getFlag('betterrolls-swade2', 'actor')
    );
}


/**
 * Connects the listener for all chat cards
 * @param {ChatMessage} message
 * @param {HTMLElement} html: html of the card
 */
export function activate_common_listeners(message, html) {
    html = $(html)  // Get sure html is a Jquery element
    // The message will be rendered at creation and each time a flag is added
    let actor = get_actor_from_message(message);
    // Actor will be undefined if this is called before flags are set
    if (actor){
        // noinspection JSUnresolvedFunction,AnonymousFunctionJS
        html.find('.brws-actor-img').addClass('bound').click(async () => {
            await manage_sheet(actor)
        });
    }
    // Selectable modifiers
    // noinspection JSUnresolvedFunction
    html.find('.brws-selectable').click(manage_selectable_click);
    // Collapsable fields
    manage_collapsables(html);
    // Old rolls
    // noinspection JSUnresolvedFunction
    html.find('.brsw-old-roll').click(async ev => {
        await old_roll_clicked(ev, message);
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
                await add_modifier(message, {label: values.label,
                    value: values.value});
            });
    })
    // Edit modifiers
    // noinspection JSUnresolvedFunction
    html.find('.brsw-edit-modifier').click((ev) => {
        const label_mod = game.i18n.localize("BRSW.Modifier");
        const default_value = ev.currentTarget.dataset.value;
        const default_label = ev.currentTarget.dataset.label;
        const index = ev.currentTarget.dataset.index;
        simple_form(game.i18n.localize("BRSW.EditModifier"),
            [{label: 'Label', default_value: default_label},
                {id: 'value', label: label_mod, default_value: default_value}],
            async values => {
                await edit_modifier(message, parseInt(index),
                    {name: values.Label, value: values.value,
                        extra_class: parseInt(values.value) < 0 ? ' brsw-red-text' : ''});
            });
    })
    // Edit die results
    // noinspection JSUnresolvedFunction
    html.find('.brsw-override-die').click((ev) => {
        // Collect roll data
        let roll_data = null;
        //TODO: Differentiate die source
        let render_data = message.getFlag('betterrolls-swade2', 'render_data');
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
                actor.isWildcard);
            await update_message(message, get_actor_from_message(message), render_data);
        });
    })
    // Delete modifiers
    // noinspection JSUnresolvedFunction
    html.find('.brsw-delete-modifier').click(async (ev) => {
        await delete_modifier(message, parseInt(ev.currentTarget.dataset.index));
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
                await edit_tn(message, index, values.tn, "");
        });
    });
    // TNs from target
    // noinspection JSUnresolvedFunction
    html.find('.brsw-target-tn, .brsw-selected-tn').click(ev => {
        const index = ev.currentTarget.dataset.index;
        get_tn_from_target(message, parseInt(index),
            ev.currentTarget.classList.contains('brsw-selected-tn'));
    })
    // Repeat card
    // noinspection JSUnresolvedFunction
    html.find('.brsw-repeat-card').click((ev) => {
        // noinspection JSIgnoredPromiseFromCall
        duplicate_message(message, ev);
    })
}


/**
 * Manage collapsable fields
 * @param html
 */
export function manage_collapsables(html) {
    let collapse_buttons = html.find('.brsw-collapse-button');
    collapse_buttons.click(e => {
        e.preventDefault();
        e.stopPropagation();
        let clicked = $(e.currentTarget)
        let collapsable_span = html.find('.' + clicked.attr('data-collapse'));
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
    });
}

/**
 * Mark and unmark selectable items
 * @param ev mouse click event
 */
export function manage_selectable_click(ev){
    ev.preventDefault();
    ev.stopPropagation();
    if (ev.currentTarget.classList.contains('brws-permanent-selected')) {
        ev.currentTarget.classList.remove('brws-selected');
        ev.currentTarget.classList.remove('brws-permanent-selected')
    } else {
        if (ev.currentTarget.classList.contains('brws-selected')) {
            ev.currentTarget.classList.add('brws-permanent-selected');
        } else {
            ev.currentTarget.classList.add('brws-selected');
        }
    }
}


/**
 * Controls the sheet status when the portrait in the header is clicked
 * @param {Actor} actor: The actor instance that created the chat card
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
 * @param {string} html: Card html
 * @param old_options: Options used as default
 */
export function get_roll_options(html, old_options){
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
        let tray_modifier = parseInt($("input.dice-tray__input").val());
        if (tray_modifier) {
            modifiers.push(tray_modifier);
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
        test_fumble_roll.roll()
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
            result = result + Math.min(roll.ap, roll.armor);
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
    if (remove_die) {
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
 * @param {SwadeActor }actor
 * @param render_data
 */
export async function update_message(message, actor, render_data) {
    if (message.getFlag('betterrolls-swade2', 'card_type') ===
            BRSW_CONST.TYPE_ITEM_CARD) {
        const item = get_item_from_message(message, actor);
        render_data.skill = get_item_trait(item, actor);
    }
    create_render_options(actor, render_data, undefined);
    let new_content = await renderTemplate(render_data.template, render_data);
    // noinspection JSCheckFunctionSignatures
    new_content = TextEditor.enrichHTML(new_content, {});
    await message.update({content: new_content});
    await store_render_flag(message, render_data);
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
            getProperty(actor.data, 'data.details.conviction.active')) {
        let conviction_roll = new Roll('1d6x');
        conviction_roll.roll();
        // noinspection JSIgnoredPromiseFromCall
        conviction_roll.toMessage(
            {flavor: game.i18n.localize('BRSW.ConvictionRoll')});
        conviction_modifier = create_modifier(
            game.i18n.localize('SWADE.Conv'), conviction_roll.total)
    }
    return conviction_modifier
}


// noinspection FunctionTooLongJS
/**
 * Get all the options needed for a new roll
 * @param actor
 * @param message
 * @param extra_options
 * @param extra_data
 * @param options
 * @param html
 * @param rof
 * @param trait_dice
 * @param modifiers
 * @param total_modifiers
 */
function get_new_roll_options(actor, message, extra_options, extra_data, options, html, rof, trait_dice, modifiers, total_modifiers) {
    let objetive = get_targeted_token();
    if (!objetive) {
        canvas.tokens.controlled.forEach(token => {
            // noinspection JSUnresolvedVariable
            if (token.actor !== actor) {
                objetive = token;
            }
        })
    }
    let skill = get_skill_from_message(message, actor);
    if (objetive && skill) {
        const token_id = message.getFlag('betterrolls-swade2', 'token')
        const origin_token = token_id ? canvas.tokens.get(token_id) :
            actor.getActiveTokens()[0]
        const item = get_item_from_message(message, actor)
        const target_data = get_tn_from_token(
            skill, objetive, origin_token, item);
        extra_options.tn = target_data.value;
        extra_options.tn_reason = target_data.reason;
        extra_options.target_modifiers = target_data.modifiers;
    }
    if (extra_data.hasOwnProperty('tn')) {
        extra_options.tn = extra_data.tn;
        extra_options.tn_reason = extra_data.tn_reason.slice(0, 20);
    }
    if (extra_data.hasOwnProperty('rof')) {
        extra_options.rof = extra_data.rof;
    }
    options = get_roll_options(html, extra_options);
    rof = options.rof || 1;
    // Trait modifier
    if (parseInt(trait_dice.die.modifier)) {
        const mod_value = parseInt(trait_dice.die.modifier)
        modifiers.push(create_modifier(
            game.i18n.localize("BRSW.TraitMod"), mod_value))
        total_modifiers += mod_value;
    }
    // Betterrolls modifiers
    options.additionalMods.forEach(mod => {
        const mod_value = parseInt(mod);
        modifiers.push(create_modifier('Better Rolls', mod_value))
        total_modifiers += mod_value;
    })
    // Wounds
    const woundPenalties = actor.calcWoundPenalties();
    if (woundPenalties !== 0) {
        modifiers.push(create_modifier(
            game.i18n.localize('SWADE.Wounds'), woundPenalties))
        total_modifiers += woundPenalties;
    }
    // Fatigue
    const fatiguePenalties = actor.calcFatiguePenalties();
    if (fatiguePenalties !== 0) {
        modifiers.push(create_modifier(
            game.i18n.localize('SWADE.Fatigue'), fatiguePenalties))
        total_modifiers += fatiguePenalties;
    }
    // Own status
    const statusPenalties = actor.calcStatusPenalties();
    if (statusPenalties !== 0) {
        modifiers.push(create_modifier(
            game.i18n.localize('SWADE.Status'), statusPenalties))
        total_modifiers += statusPenalties;
    }
    // Armor min str
    if (skill?.data.data.attribute === 'agility') {
        let armor_penalty = get_actor_armor_minimum_strength(actor)
        if (armor_penalty) {
            total_modifiers += armor_penalty.value
            modifiers.push(armor_penalty)
        }
    }
    // Target Mods
    if (extra_options.target_modifiers) {
        extra_options.target_modifiers.forEach(modifier => {
            total_modifiers += modifier.value;
            modifiers.push(modifier);
        })
    }
    // Action mods
    if (message.getFlag('betterrolls-swade2', 'card_type') ===
        BRSW_CONST.TYPE_ITEM_CARD) {
        const item = get_item_from_message(message, actor)
        // noinspection JSUnresolvedVariable
        if (item.data.data.actions.skillMod) {
            // noinspection JSUnresolvedVariable
            let new_mod = create_modifier(game.i18n.localize("BRSW.ItemMod"), item.data.data.actions.skillMod)
            modifiers.push(new_mod)
            total_modifiers += new_mod.value
        }
    }
    // Options set from card
    if (extra_data.modifiers) {
        extra_data.modifiers.forEach(modifier => {
            modifiers.push(modifier);
            total_modifiers += modifier.value;
        })
    }
    //Conviction
    const conviction_modifier = check_and_roll_conviction(actor);
    if (conviction_modifier) {
        modifiers.push(conviction_modifier);
        total_modifiers += conviction_modifier.value
    }
    // Joker
    if (has_joker(message.getFlag('betterrolls-swade2', 'token'))) {
        modifiers.push(create_modifier('Joker', 2))
        total_modifiers += 2;
    }
    return {options, rof, total_modifiers};
}

/**
 * Get the options for a reroll
 */
function get_reroll_options(rof, actor, render_data, modifiers, total_modifiers, extra_data, options) {
    // Reroll, keep old options
    rof = actor.isWildcard ? render_data.trait_roll.rolls.length - 1 : render_data.trait_roll.rolls.length;
    modifiers = render_data.trait_roll.modifiers;
    let reroll_mods_applied = false;
    modifiers.forEach(mod => {
        total_modifiers += mod.value
        if (mod.name.includes('(reroll)')) {
            reroll_mods_applied = true;
        }
    });
    if (extra_data.reroll_modifier && !reroll_mods_applied) {
        modifiers.push(create_modifier(
            `${extra_data.reroll_modifier.name} (reroll)`,
            extra_data.reroll_modifier.value))
        total_modifiers += extra_data.reroll_modifier.value;
    }
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
    return {rof, modifiers, total_modifiers, options};
}

async function show_3d_dice(roll, message, modifiers) {
    let wild_die_theme;
    try {
        // Swade 16
        wild_die_theme = game.settings.get('swade', 'dsnWildDie');
    } catch (_) {
        // Swade 16.0.3
        wild_die_theme = game.user.getFlag('swade', 'dsnWildDie') || "none";
    }
    if (wild_die_theme !== 'none') {
        roll.dice[roll.dice.length - 1].options.colorset = wild_die_theme;
    }
    let users = null;
    if (message.data.whisper.length > 0) {
        users = message.data.whisper;
    }
    const blind = message.data.blind
    // Dice buried in modifiers.
    for (let modifier of modifiers) {
        if (modifier.dice) {
            // noinspection ES6MissingAwait
            game.dice3d.showForRoll(modifier.dice, game.user, true, users, blind)
        }
    }
    await game.dice3d.showForRoll(roll, game.user, true, users, blind);
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
    let render_data = message.getFlag('betterrolls-swade2', 'render_data');
    const actor = get_actor_from_message(message);
    let total_modifiers = 0;
    let modifiers = [];
    let rof;
    let extra_options = {};
    let options = {};
    if (!render_data.trait_roll.rolls.length) {
        const __ret = get_new_roll_options(actor, message, extra_options, extra_data, options, html, rof, trait_dice, modifiers, total_modifiers);
        options = __ret.options;
        rof = __ret.rof;
        total_modifiers = __ret.total_modifiers;
    } else {
        const __ret = get_reroll_options(rof, actor, render_data, modifiers, total_modifiers, extra_data, options);
        rof = __ret.rof;
        modifiers = __ret.modifiers;
        total_modifiers = __ret.total_modifiers;
        options = __ret.options;
    }
    render_data.trait_roll.is_fumble = false;
    let trait_rolls = [];
    let dice = [];
    let roll_string = create_roll_string(trait_dice, rof);
    // Make penalties red
    for (let mod of modifiers) {
        if (mod.value < 0) {
            mod.extra_class = ' brsw-red-text'
        }
    }
    // Wild Die
    let wild_die_formula = `+1d${trait_dice['wild-die'].sides}x`;
    if (extra_data.hasOwnProperty('wildDieFormula')) {
        wild_die_formula = extra_data.wildDieFormula;
    }
    if (actor.isWildcard && wild_die_formula) {
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
                result: term.total + total_modifiers, extra_class: extra_class,
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
        await show_3d_dice(roll, message, modifiers);
    }
    render_data.trait_roll.is_fumble = await calculate_results(
        trait_rolls, false, actor.isWildcard, dice)
    render_data.trait_roll.rolls = trait_rolls;
    render_data.trait_roll.modifiers = modifiers;
    render_data.trait_roll.dice = dice;
    for (let key in extra_data) {
        if (extra_data.hasOwnProperty(key)) {
            render_data[key] = extra_data[key];

        }
    }
    await update_message(message, actor, render_data)
    return render_data.trait_roll;
}

/**
 * Get a skill in a message
 * @param {ChatMessage} message
 * @param {SwadeActor} actor
 */
function get_skill_from_message(message, actor) {
    const type = message.getFlag('betterrolls-swade2', 'card_type');
    const render_data = message.getFlag('betterrolls-swade2', 'render_data')
    let skill;
    if (render_data.hasOwnProperty('trait_id')) {
        skill = actor.items.get(render_data.trait_id);
    } else if (type === BRSW_CONST.TYPE_ITEM_CARD) {
        const item = actor.items.get(message.getFlag(
            'betterrolls-swade2', 'item_id'));
        skill = get_item_trait(item, actor);
    }
    return skill
}


/**
 * Function that exchanges roll when clicked
 * @param event: mouse click event
 * @param message:
 */
async function old_roll_clicked(event, message) {
    const index = event.currentTarget.dataset.index;
    const actor = get_actor_from_message(message);
    const item = get_item_from_message(message, actor);
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
    if (item) {
        render_data.skill = get_item_trait(item, actor);
    }
    await update_message(message, actor, render_data);
}


/**
 * Updates the total results of an old stored rolls in a value
 * @param trait_roll
 * @param mod_value
 */
async function update_roll_results(trait_roll, mod_value) {
        trait_roll.rolls.forEach(roll => {
            roll.result += mod_value;
        });
        trait_roll.is_fumble = await calculate_results(
            trait_roll.rolls, false, false, [])
        for (const old_roll of trait_roll.old_rolls) {
            for (const roll of old_roll) {
                roll.result += mod_value;
            }
            trait_roll.is_fumble = await calculate_results(
                old_roll, false, false, [])
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
async function override_die_result(roll_data, die_index, new_value, is_damage_roll = false, is_wildcard) {
    let total_modifier = 0
    roll_data.modifiers.forEach(mod => {
        total_modifier += mod.value;
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
            if (message.data.whisper.length > 0) {
                users = message.data.whisper;
            }
            await game.dice3d.showForRoll(new_mod.dice, game.user, true, users, message.data.blind);
        }
        new_mod.extra_class = new_mod.value < 0 ? ' brsw-red-text' : ''
        render_data.trait_roll.modifiers.push(new_mod)
        await update_roll_results(render_data.trait_roll, new_mod.value);
        await update_message(message, get_actor_from_message(message), render_data);
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
    await update_message(message, get_actor_from_message(message), render_data);
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
        await update_message(message, get_actor_from_message(message), render_data);
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
    await update_message(message, get_actor_from_message(message), render_data)
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
    let actor = get_actor_from_message(message);
    if (selected) {
        canvas.tokens.controlled.forEach(token => {
            // noinspection JSUnresolvedVariable
            if (token.actor !== actor) {
                objetive = token;
            }
        });
    } else {
        objetive = get_targeted_token();
    }
    if (objetive) {
        const token_id = message.getFlag('betterrolls-swade2', 'token')
        const item = get_item_from_message(message, actor)
        const origin_token = token_id ? canvas.tokens.get(token_id) :
                actor.getActiveTokens()[0]
        const skill = get_skill_from_message(message, get_actor_from_message(message));
        const target = get_tn_from_token(skill, objetive, origin_token, item);
        if (target.value) {
            // Don't update if we didn't get a value
            // noinspection JSIgnoredPromiseFromCall
            edit_tn(message, index, target.value, target.reason)
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
            const swade_value = combatant.data?.flags?.swade?.cardValue || 0;
            if (swade_value >= 95) {
                joker = true;
            }
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
    let data = duplicate(message.data);
    // Remove rolls
    data.timestamp = new Date().getTime();
    data.flags['betterrolls-swade2'].render_data.trait_roll = new BRWSRoll();
    data.flags['betterrolls-swade2'].render_data.damage_rolls = [];
    delete data._id;
    let new_message = await ChatMessage.create(data);
    await update_message(new_message, get_actor_from_message(message),
        data.flags['betterrolls-swade2'].render_data);
    const action = get_action_from_click(event);
    if (action.includes('trait')) {
        // noinspection JSUnresolvedVariable
        const card_type = data.flags['betterrolls-swade2'].card_type;
        if (card_type === BRSW_CONST.TYPE_ATTRIBUTE_CARD) {
            await roll_attribute(new_message, $(message.data.content), false);
        } else if (card_type === BRSW_CONST.TYPE_SKILL_CARD) {
            await roll_skill(new_message, $(message.data.content), false);
        } else if (card_type === BRSW_CONST.TYPE_ITEM_CARD) {
            const roll_damage = action.includes('damage')
            await roll_item(new_message, $(message.data.content), false,
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
        if (expression.indexOf('d')) {
            // This is a die expression
            modifier.dice = new Roll(expression)
            modifier.dice.evaluate({async:false})
            modifier.value = parseInt(modifier.dice.result)
        } else {
            modifier.value = parseInt(expression)
        }
    } else {
        modifier.value = parseInt(expression)
    }
    return modifier
}


/**
 * Processes actions common to skill and item cards
 */
export function process_common_actions(action, extra_data, macros) {
    let updates = {}
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
        updates[`data.status.is${action.self_add_status}`] = true
    }
    if (action.hasOwnProperty('wildDieFormula')) {
        extra_data.wildDieFormula = action.wildDieFormula;
    }
    if (action.runSkillMacro) {
        macros.push(action.runSkillMacro);
    }
    return updates
}

/**
 * Gets the bigger minimum strength
 * @param actor
 */
function get_actor_armor_minimum_strength(actor) {
    // This should affect only Agility related skills
    const min_str_armors = actor.items.filter((item) =>
        {return item.type === 'armor' && item.data.data.minStr && item.data.data.equipped})
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
    const splited_minStr = item.data.data.minStr.split('d')
    const min_str_die_size = parseInt(splited_minStr[splited_minStr.length - 1])
    let new_mod
    let str_die_size = actor?.data?.data?.attributes?.strength?.die?.sides
    if (actor?.data?.data?.attributes?.strength.encumbranceSteps) {
        str_die_size += Math.max(actor?.data?.data?.attributes?.strength.encumbranceSteps * 2, 0)
    }
    if (min_str_die_size > str_die_size) {
        // Minimum strength is not meet
        new_mod = create_modifier(game.i18n.localize(name),
            -Math.trunc((min_str_die_size - str_die_size) / 2))
    }
    return new_mod
}