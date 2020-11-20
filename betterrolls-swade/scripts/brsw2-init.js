// Init scripts for version 2
import {register_settings} from "./betterrollswade.js";
import {activate_common_listeners, BRSW_CONST} from './cards_common.js';
import {attribute_card_hooks, activate_attribute_listeners,
    activate_attribute_card_listeners} from './attribute_card.js';
import {activate_result_card_listeners} from "./result_card.js";

// Startup scripts

// Base Hook
Hooks.on(`ready`, () => {
	console.log('Better Rolls 2 for SWADE | Ready');
	// Create a base object to hook functions
    game.brsw = {};
    attribute_card_hooks();
	register_settings_version2();
    register_settings();
    // Load partials.
    const templatePaths = ['modules/betterrolls-swade/templates/common_card_header.html',
        'modules/betterrolls-swade/templates/common_card_footer.html'];
    loadTemplates(templatePaths).then(console.log(
        "Better Rolls templates preloaded"));
    // Add some jquery magic to allow binding our functions prior to system
    $.fn.bindFirst = function(name, fn) {
        // bind as you normally would
        // don't want to miss out on any jQuery magic
        this.on(name, fn);

        // Thanks to a comment by @Martin, adding support for
        // namespaced events too.
        this.each(function() {
            let handlers = $._data(this, 'events')[name.split('.')[0]];
            // take out the handler we just inserted from the end
            let handler = handlers.pop();
            // move it at the beginning
            handlers.splice(0, 0, handler);
        });
    };
})

Hooks.on('renderChatMessage', (message, html) => {
    let card_type = message.getFlag('betterrolls-swade', 'card_type')
    if (card_type) {
        // This chat card is one of ours
        activate_common_listeners(message, html);
        if (card_type === BRSW_CONST.TYPE_ATTRIBUTE_CARD) {
            activate_attribute_card_listeners(message, html);
        } else if (card_type === BRSW_CONST.TYPE_RESULT_CARD) {
            activate_result_card_listeners(html);
        }
    }
});

// Character sheet hooks

['SwadeCharacterSheet', 'SwadeNPCSheet'].forEach(name => {
    Hooks.on('render' + name, (app, html, _) => {
        activate_attribute_listeners(app, html);
    })
})

// Settings

function register_settings_version2() {
    const br_choices = {
        system: 'Default system roll', card: 'Show Betterrolls card',
        trait: "Show card and trait roll"};
    game.settings.register('betterrolls-swade', 'click', {
        name: 'Single click action',
        hint: "Select what happens when you single click a name",
        default: "system",
        scope: "world",
        type: String,
        choices: br_choices,
        config: true
    });
    game.settings.register('betterrolls-swade', 'shift_click', {
        name: 'Shift click action',
        hint: "Select what happens when you click a name while pressing SHIFT",
        default: "card",
        scope: "world",
        type: String,
        choices: br_choices,
        config: true
    });
    game.settings.register('betterrolls-swade', 'ctrl_click', {
        name: 'Control click action',
        hint: "Select what happens when you click a name while pressing Control",
        default: "card",
        scope: "world",
        type: String,
        choices: br_choices,
        config: true
    });
    game.settings.register('betterrolls-swade', 'alt_click', {
        name: 'Alt click action',
        hint: "Select what happens when you click a name while pressing Alt",
        default: "card",
        scope: "world",
        type: String,
        choices: br_choices,
        config: true
    });
    game.settings.register('betterrolls-swade', 'result-card', {
        name: 'See result card',
        hint: 'Select who if anyone can see the result card',
        default: 'all',
        scope: 'world',
        type: String,
        choices: {none: 'No result card',
            master: 'Only the master can see the card', all: 'Everybody'},
        config: true
    })
}