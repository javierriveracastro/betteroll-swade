// Init scripts for version 2
import {register_settings} from "./betterrollswade.js";
import {attribute_card_hooks} from './attribute_card.js';
import {activate_common_listeners} from './cards_common.js';

// Startup scripts

// Base Hook
Hooks.on(`ready`, () => {
	console.log('Better Rolls 2 for SWADE | Ready');
	// Create a base object to hook functions
    game.brsw = {};
    attribute_card_hooks();
	register_settings_version2();
    register_settings();
})

Hooks.on('renderChatMessage', (message, html) => {
    let card_type = message.getFlag('betterrolls-swade', 'card_type')
    if (card_type) {
        // This chat card is one of ours
        activate_common_listeners(message, html);
    }
});


// Settings

function register_settings_version2() {
    const br_choices = {
        system: 'Default system roll', card: 'Show Betterrolls card'};
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
}