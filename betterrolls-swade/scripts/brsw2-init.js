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
	register_settings();
})

Hooks.on('renderChatMessage', (message, html) => {
    let card_type = message.getFlag('betterrolls-swade', 'card_type')
    if (card_type) {
        // This chat card is one of ours
        activate_common_listeners(message, html);
    }
});