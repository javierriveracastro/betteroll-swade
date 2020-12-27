// Common functions used in all cards

import {getWhisperData, spendMastersBenny} from "./utils.js";

export const BRSW_CONST = {
    TYPE_ATTRIBUTE_CARD: 1,
    TYPE_SKILL_CARD: 2,
    TYPE_ITEM_CARD: 3,
    TYPE_DMG_CARD: 10,
    TYPE_RESULT_CARD: 100,
};

/**
* Creates the basic chat data common to most cards
* @param {SwadeActor} actor:  The actor origin of the message
* @param {int} type: The type of message
* @return An object suitable to create a ChatMessage
*/
export function create_basic_chat_data(actor, type){
    let whisper_data = getWhisperData();
    // noinspection JSUnresolvedVariable
    let chatData = {
        user: game.user._id,
        content: '<p>Default content, likely an error in Better Rolls</p>',
        speaker: {
            actor: actor._idx,
            token: actor.token,
            alias: actor.name
        },
        type: type,
        blind: whisper_data.blind
    }
    if (whisper_data.whisper) {
        chatData.whisper = whisper_data.whisper
    }
    if (type === CONST.CHAT_MESSAGE_TYPES.ROLL) {
        chatData.roll = new Roll("0").roll();
        chatData.rollMode = whisper_data.rollMode;
    }
    // noinspection JSValidateTypes
    return chatData
}


/**
 * Creates de common render options for all the cards
 * @param {Actor} actor
 * @param {object} options: options for this card
 */
export function create_render_options(actor, options) {
    options.bennie_avaliable = are_bennies_available(actor);
    return options;
}


/**
 * Returns true if an actor has bennies available or is master controlled.
 * @param {Actor} actor: The actor that we are checking
 */
function are_bennies_available(actor) {
    if (actor.hasPlayerOwner) {
        if (actor.data.data.bennies.value < 1) return false;
    }
    return true;
}

/**
 * Expends a bennie
 * @param {SwadeActor} actor: Actor who is going to expend the bennie
 */
export function spend_bennie(actor){
    // Dice so Nice animation
    if (game.dice3d) {
        const benny = new Roll('1dB').roll();
        game.dice3d.showForRoll(benny, game.user, true, null, false);
    }
    if (actor.hasPlayerOwner) {
        // noinspection JSIgnoredPromiseFromCall
        actor.spendBenny();
    } else if (actor.data.data.wildcard && actor.data.data.bennies.value > 0) {
        actor.spendBenny();
    } else {
        spendMastersBenny();
    }
}

/**
 * Try to get an actor from a token or an actor id
 * @param token_id
 * @param actor_id
 */
export function get_actor_from_ids(token_id, actor_id) {
    if (canvas) {
        if (token_id) {
            let token = canvas.tokens.get(token_id);
            if (token) return token.actor
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
        html.find('.brws-actor-img').addClass('bound').click(async () => {
            await manage_sheet(actor)
        });
    }
    // Selectable modifiers
    html.find('.brws-selectable').click(manage_selectable_click);
    // Collapsable fields
    let collapse_buttons = html.find('.brsw-collapse-button');
	collapse_buttons.click(e => {
		e.preventDefault();
		e.stopPropagation();
		let clicked = $(e.currentTarget)
		let collapsable_span = html.find('.' + clicked.attr('data-collapse'));
		collapsable_span.toggleClass('brsw-collapsed');
		if (collapsable_span.hasClass('brsw-collapsed')) {
			clicked.find('.fas').removeClass('fa-caret-down');
			clicked.find('.fas').addClass('fa-caret-right');
		} else {
			clicked.find('.fas').addClass('fa-caret-down');
			clicked.find('.fas').removeClass('fa-caret-right');
		}
	})
    // Popout button
    html.find(".brsw-popup").click(() => {
        let popup = new ChatPopout(message);
        popup.render(true);
    })
}


/**
 * Mark and unmark selectable items
 * @param ev mouse click event
 */
export function manage_selectable_click(ev){
    ev.preventDefault();
    ev.stopPropagation();
    if (ev.currentTarget.classList.contains('brws-selected')) {
        ev.currentTarget.classList.remove('brws-selected');
    } else {
        ev.currentTarget.classList.add('brws-selected');
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
 * Gets the expected action, whenever to show the card, do a system roll, etc,
 * from a click event and the settings
 * @param {event} event
 */
export function get_action_from_click(event){
    let setting_name = 'click'
    if (event.shiftKey) {
        setting_name = 'shift_click'
    } else if (event.ctrlKey) {
        setting_name = 'ctrl_click'
    } else if (event.altKey) {
        setting_name = 'alt_click'
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
    html = $(html)
    let modifiers = old_options.additionalMods || []
    let tn = old_options.tn || 4;
    let rof = old_options.rof || 1;
    html.find('.brws-selectable.brws-selected').each((_, element) => {
        if (element.dataset.type === 'modifier') {
            modifiers.push(element.dataset.value);
        } else if (element.dataset.type === 'tn') {
            tn = parseInt(element.dataset.value);
        } else if (element.dataset.type === 'rof') {
            rof = parseInt(element.dataset.value);
        }
    });
    html.find('.brsw-input-options').each((_, element) => {
        if (element.value) {
            if (element.dataset.type === 'modifier') {
                // Modifiers need to start by a math symbol
                if (element.value.slice(0, 1) === '+'
                        || element.value.slice(0, 1) === '-') {
                    modifiers.push(element.value);
                } else {
                    modifiers.push('+' + element.value);
                }
            } else if (element.dataset.type === 'tn') {
                tn = parseInt(element.value) || 0;
            } else if (element.dataset.type === 'rof') {
                rof = parseInt(element.value) || 1;
            }
        }
    })
    // We only use the Dice Tray modifier on total new rolls
    if (! old_options.hasOwnProperty('additionalMods')) {
        let tray_modifier = parseInt($("input.dice-tray__input").val());
        if (tray_modifier) {
            modifiers.push(tray_modifier);
        }
    }
    return {additionalMods: modifiers, tn: tn, rof: rof}
}

/**
 * Try to detect if a roll is a fumble
 * @param {Roll} roll
 */
export function detect_fumble(roll) {
    let fumble = 0;
    // noinspection ES6MissingAwait
    roll.terms[0].results.forEach(partial_roll => {
        if (partial_roll.hasOwnProperty('result')) {
            // Extra rolling one dice
            // noinspection JSIncompatibleTypesComparison
            if (partial_roll.result === 1 && roll.terms[0].results.length === 1) {
                let test_fumble_roll = new Roll('1d6');
                test_fumble_roll.roll()
                test_fumble_roll.toMessage(
                    {flavor: game.i18n.localize('BRWS.Testing_fumbles')});
                // noinspection EqualityComparisonWithCoercionJS
                if (test_fumble_roll.result == 1) fumble=999;
            }
        } else {
            partial_roll.dice.forEach(die => {
                fumble += die.total === 1? 1: -1
            });
        }
    });
    return fumble > 0;
}


/**
 * Function to convert trait dice and modifiers into a string
 * @param trait
 */
export function trait_to_string(trait) {
    let string = `${name} d${trait.die.sides}`;
    let modifier = parseInt(
        trait.die.modifier);
    if (modifier) {
        string = string + (modifier > 0?"+":"") + modifier;
    }
    return string;
}