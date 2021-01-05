// Common functions used in all cards

import {getWhisperData, spendMastersBenny} from "./utils.js";
import {get_item_from_message, get_item_skill} from "./item_card.js";

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
    this.rolls = []; // Array with all the dice rolled {sides, result,
        // extra_class, tn, result_txt, result_icons}
    this.modifiers = []; // Array of modifiers {name,  value, extra_class}
    this.dice = []; // Array with the dices {sides, results: [int], label, extra_class}
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
    const properties_to_delete = ['actor', 'skill', 'bennie_avaliable'];
    properties_to_delete.forEach(property => {
        if (render_object.hasOwnProperty(property)) {
            delete render_object[property];
        }
    });
    await message.setFlag('betterrolls-swade2', 'render_data',
        render_object);
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
    await store_render_flag(message, render_object);
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
 * @para item: An item object
 */
export function create_render_options(actor, options) {
    options.bennie_avaliable = are_bennies_available(actor);
    options.actor = actor;
    options.result_master_only =
        game.settings.get('betterrolls-swade2', 'result-card') === 'master';
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
    // Old rolls
    // noinspection JSUnresolvedFunction
    html.find('.brsw-old-roll').click(async ev => {
        await old_roll_clicked(ev, message);
    });
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
    let tn_reason = old_options.tn_reason || game.i18n.localize("BRSW.Default");
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
    return {additionalMods: modifiers, dmgMods: dmg_modifiers, tn: tn, rof: rof,
        tn_reason: tn_reason}
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
 * Calculates the results of a roll
 * @param {[]} rolls A rolls list see BSWRoll doc
 */
function calculate_results(rolls) {
    rolls.forEach(roll => {
        let result = roll.result - roll.tn;
        if (result < 0) {
            roll.result_text = game.i18n.localize('BRSW.Failure');
            roll.result_icon = '<i class="brsw-red-text fas fa-minus-circle"></i>'
        } else if (result < 4) {
            roll.result_text = game.i18n.localize('BRSW.Success');
            roll.result_icon = '<i class="brsw-blue-text fas fa-check"></i>'
        } else if(result < 8) {
            roll.result_text = game.i18n.localize('BRSW.Raise');
            roll.result_icon = '<i class="brsw-blue-text fas fa-check-double"></i>'
        } else {
            const raises = Math.floor(result / 4)
            roll.result_text = game.i18n.localize(
                'BRSW.Raise_plural') + ' ' + raises;
            roll.result_icon = raises.toString() +
                '<i class="brsw-blue-text fas fa-check-double"></i>';
        }
    });
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
    const template = message.getFlag('betterrolls-swade2', 'template');
    const actor = get_actor_from_message(message);
    let total_modifiers = 0;
    let modifiers = [];
    let rof;
    let extra_options = {};
    if (extra_data.hasOwnProperty('tn')) {
        extra_options.tn = extra_data.tn;
        extra_options.tn_reason = extra_data.tn_reason.slice(0,20);
    }
    let options = get_roll_options(html, extra_options);
    if (!render_data.trait_roll.rolls.length) {
        // New roll, we need top get all tje options
        rof = options.rof || 1;
        // Trait modifier
        if (parseInt(trait_dice.die.modifier)){
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
        // Action mods
        if (trait_dice.hasOwnProperty('actions')) {
            if (trait_dice.actions.skillMod) {
                const mod_value = parseInt(trait_dice.actions.skillMod);
                modifiers.push({
                    name: game.i18n.localize("BRSW.ItemMod"),
                    value: mod_value
                })
                total_modifiers += mod_value
            }
        }
        //Conviction
        if (actor.isWildcard &&
                game.settings.get('swade', 'enableConviction') &&
                getProperty(actor.data, 'data.details.conviction.active')) {
            let conviction_roll = new Roll('1d6x');
            conviction_roll.roll();
            conviction_roll.toMessage(
                {flavor: game.i18n.localize('BRSW.ConvictionRoll')});
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
        render_data.trait_roll.old_rolls.push(
            render_data.trait_roll.rolls);
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
                result: term.total + total_modifiers, extra_class: extra_class,
                tn: options.tn, tn_reason: options.tn_reason});
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
    // Remove Wild die
    if (actor.isWildcard) {
        trait_rolls[min_position].extra_class += ' brsw-discarded-roll';
        trait_rolls[min_position].tn = 0;
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
    // Calculate results
    if (!render_data.trait_roll.is_fumble) {
        calculate_results(trait_rolls);
    }
    // TODO: Add modifiers
    // TODO: Delete modifiers
    // TODO: Edit modifiers.
    // TODO: Edit TNs
    // TODO: Keep old rolls
    render_data.trait_roll.rolls = trait_rolls;
    render_data.trait_roll.modifiers = modifiers;
    render_data.trait_roll.dice = dice;
    for (let key in extra_data) {
        if (extra_data.hasOwnProperty(key)) {
            render_data[key] = extra_data[key];

        }
    }
    create_render_options(actor, render_data);
    const new_content = await renderTemplate(template, render_data);
    message.update({content: new_content});
    await store_render_flag(message, render_data);
    return render_data.trait_roll;
}


/**
 * Function that exchanges roll when clicked
 * @param event: mouse click event
 * @param message:
 */
async function old_roll_clicked(event, message) {
    const index = event.currentTarget.dataset.index;
    const template = message.getFlag('betterrolls-swade2', 'template');
    const actor = get_actor_from_message(message);
    const item = get_item_from_message(message, actor);
    console.log(item)
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
        render_data.skill = get_item_skill(item, actor);
    }
    create_render_options(actor, render_data);
    const new_content = await renderTemplate(template, render_data);
    message.update({content: new_content});
    await store_render_flag(message, render_data);
}