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
 * A constructor for our own roll object
 * @constructor
 */
export function BRWSRoll() {
    this.rolls = []; // Array with all the dice rolled {sides, result, extra_class}
    this.modifiers = []; // Array of modifiers {name,  value, extra_class}
    this.dice = []; // Array with the dices {sides, results: [int], label, extra_class}
    this.is_fumble = false
}


/**
 * Creates a char card
 *
 * @param {Token, SwadeActor} origin The origin of this card
 * @param {object} render_data Data to pass to the render template
 * @param chat_type Type of char message
 * @param {string} template Path to the template that renders this card
 * @return {Promise<ChatMessage>}
 */
export async function create_common_card(origin, render_data, chat_type, template) {
    let actor = origin.hasOwnProperty('actor')?origin.actor:origin;
    let render_object = create_render_options(
        actor, render_data)
    let chatData = create_basic_chat_data(actor, chat_type);
    chatData.content = await renderTemplate(template, render_object);
    let message = await ChatMessage.create(chatData);
    // Remove actor to store the render data.
    delete render_object.actor;
    await message.setFlag('betterrolls-swade2', 'render_data',
        render_object);
    await message.setFlag('betterrolls-swade2', 'template',
        template);
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
    options.actor = actor;
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
export async function spend_bennie(actor){
    // Dice so Nice animation
    if (game.dice3d) {
        const benny = new Roll('1dB').roll();
        // noinspection JSIgnoredPromiseFromCall,ES6MissingAwait
        game.dice3d.showForRoll(benny, game.user, true, null, false);
    }
    if (actor.hasPlayerOwner) {
        await actor.spendBenny();
    } else if (actor.data.data.wildcard && actor.data.data.bennies.value > 0) {
        await actor.spendBenny();
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
        // noinspection JSUnresolvedFunction
        html.find('.brws-actor-img').addClass('bound').click(async () => {
            await manage_sheet(actor)
        });
    }
    // Selectable modifiers
    // noinspection JSUnresolvedFunction
    html.find('.brws-selectable').click(manage_selectable_click);
    // Collapsable fields
    manage_collapsables(html);
    // Popout button
    // noinspection JSUnresolvedFunction
    html.find(".brsw-popup").click(() => {
        let popup = new ChatPopout(message);
        popup.render(true);
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
 * Gets the expected action, whenever to show the card, do a system roll, etc,
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
    html = $(html)
    let modifiers = old_options.additionalMods || [];
    let dmg_modifiers = old_options.dmgMods || [];
    let tn = old_options.tn || 4;
    let rof = old_options.rof || 1;
    // noinspection JSUnresolvedFunction
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
    return {additionalMods: modifiers, dmgMods: dmg_modifiers, tn: tn, rof: rof}
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
                fumble += die.total === 1 ? 1: -1
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


/**
 * Makes a roll trait
 * @param message
 * @param trait_dice An object representing a trait dice
 * @param dice_label: Label for the trait die
 * @param {string} html: Html to be parsed for extra options.
 */
export async function roll_trait(message, trait_dice, dice_label, html) {
    let render_data = message.getFlag('betterrolls-swade2', 'render_data');
    const template = message.getFlag('betterrolls-swade2', 'template');
    const actor = get_actor_from_message(message);
    let total_modifiers = 0;
    let modifiers = [];
    let rof;
    if (!render_data.trait_roll.rolls.length) {
        // New roll, we need top get all tje options
        let options = get_roll_options(html, {});
        rof = options.rof || 1;
        // Trait modifier
        if (trait_dice.die.modifier){
            const mod_value = parseInt(trait_dice.die.modifier)
            modifiers.push({name: game.i18n.localize("BRSW.TraitMod"),
                value: mod_value, extra_class: ''});
            total_modifiers += mod_value;
        }
        // Betterrolls modifiers
        options.additionalMods.forEach(mod => {
            const mod_value = parseInt(mod);
            modifiers.push({name: 'Better Rolls', value: mod_value, extra_class: ''});
            total_modifiers += mod_value;
        })
        // Wounds
        const woundPenalties = actor.calcWoundPenalties();
        if (woundPenalties !== 0) {
            modifiers.push({
                name: game.i18n.localize('SWADE.Wounds'),
                value: woundPenalties,
            });
            total_modifiers += woundPenalties;
        }
        // Fatigue
        const fatiguePenalties = actor.calcFatiguePenalties();
        if (fatiguePenalties !== 0) {
            modifiers.push({
                name: game.i18n.localize('SWADE.Fatigue'),
                value: fatiguePenalties,
            });
            total_modifiers += fatiguePenalties;
        }
        // Own status
        const statusPenalties = actor.calcStatusPenalties();
        if (statusPenalties !== 0) {
            modifiers.push({
                name: game.i18n.localize('SWADE.Status'),
                value: statusPenalties,
            });
            total_modifiers += statusPenalties;
        }
        // Target Mods
        if (game.user.targets.size) {
            const objetive = Array.from(game.user.targets);
            console.log(objetive[0].actor)
            // noinspection JSUnresolvedVariable
            if (objetive[0].actor.data.data.status.isVulnerable ||
                objetive[0].actor.data.data.status.isStunned) {
                modifiers.push({
                    name: `${objetive[0].name}: ${game.i18n.localize('SWADE.Vuln')}`,
                    value: 2
                });
                total_modifiers += 2;
            }
        }
        //Conviction
        if (actor.isWildcard &&
                game.settings.get('swade', 'enableConviction') &&
                getProperty(actor.data, 'data.details.conviction.active')) {
            let conviction_roll = new Roll('1d6x');
            conviction_roll.roll();
            conviction_roll.toMessage(
                {flavor: game.i18n.localize('BRWS.ConvictionRoll')});
            modifiers.push({
                'name': game.i18n.localize('SWADE.Conv'),
                value: conviction_roll.total
            });
            total_modifiers += conviction_roll.total;
        }
    } else {
        // Reroll, keep old options
        rof = render_data.trait_roll.rolls.length - 1;
        modifiers = render_data.trait_roll.modifiers;
        modifiers.forEach(mod => {
            total_modifiers += mod.value
        });
        render_data.trait_roll.rolls = [];
    }
    // Get options from html
    let fumble_possible = 0;
    render_data.trait_roll.is_fumble = false;
    let trait_rolls = [];
    let dice = [];
    let roll_string = `1d${trait_dice.die.sides}x`
    for (let i = 0; i < (rof - 1); i++) {
        roll_string += `+1d${trait_dice.die.sides}x`
    }
    // Make penalties red
    modifiers.forEach(mod => {
        if (mod.value < 0) {
            mod.extra_class = ' brsw-red-text'
        }
    })
    // Wild Die
    if (actor.isWildcard) {
        roll_string += `+1d${trait_dice['wild-die'].sides}x`
    }
    let roll = new Roll(roll_string);
    roll.evaluate()
    let min_value = 99999999;
    let min_position = 0;
    let index = 0
    roll.terms.forEach((term) => {
        if (term.hasOwnProperty('faces')) {
            // Results
            let extra_class = '';
            fumble_possible += 1;
            if (term.total === 1) {
                extra_class = ' brsw-red-text';
                fumble_possible -= 2;
            } else if (term.total > term.faces) {
                extra_class = ' brsw-blue-text';
            }
            trait_rolls.push({sides: term.faces,
                result: term.total + total_modifiers, extra_class: extra_class});
            // Dies
            let new_die = {faces: term.faces, results: [], label: dice_label,
                extra_class: ''};
            term.results.forEach(result => {
                new_die.results.push(result.result);
            })
            dice.push(new_die);
            // Find minimum roll
            if (term.total < min_value) {
                min_value = term.total;
                min_position = index;
            }
            index += 1;
        }
    })
    if (actor.isWildcard) {
        trait_rolls[min_position].extra_class += ' brsw-discarded-roll';
        dice[min_position].extra_class += ' brsw-discarded-roll';
        dice[dice.length - 1].label = game.i18n.localize("SWADE.WildDie");
    }
    // Fumble detection
    if (!actor.isWildcard && fumble_possible < 1) {
        let test_fumble_roll = new Roll('1d6');
        test_fumble_roll.roll()
        test_fumble_roll.toMessage(
    {flavor: game.i18n.localize('BRWS.Testing_fumbles')});
        if (test_fumble_roll.total === 1) {
            render_data.trait_roll.is_fumble = true;
        }
    } else if (actor.isWildcard && fumble_possible < 0) {
        // It is only a fumble if the Wild Die is 1
        render_data.trait_roll.is_fumble = dice[dice.length - 1].results[0] === 1;
    }
    if (game.dice3d) {
        roll.dice[roll.dice.length - 1].options.colorset = game.settings.get(
            'betterrolls-swade2', 'wildDieTheme');
        // noinspection ES6MissingAwait
        game.dice3d.showForRoll(roll, game.user, true)
    }
    render_data.trait_roll.rolls = trait_rolls;
    render_data.trait_roll.modifiers = modifiers;
    render_data.trait_roll.dice = dice;
    await message.setFlag('betterrolls-swade2', 'render_data', render_data)
    create_render_options(actor, render_data);
    const new_content = await renderTemplate(template, render_data);
    message.update({content: new_content});
    delete render_data.actor; // Can't be stored on a flag.
    delete render_data.bennie_avaliable;
    return render_data.trait_roll
}