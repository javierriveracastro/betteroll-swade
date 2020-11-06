// Init scripts for version 2
import {register_settings} from "./betterrollswade.js";
import {attribute_card_hooks} from './attribute_card.js';

// Startup scripts

// Base Hook
Hooks.on(`ready`, () => {
	console.log('Better Rolls 2 for SWADE | Ready');
	// Create a base object to hook functions
    game.brsw = {};
    attribute_card_hooks();
	register_settings();
})

