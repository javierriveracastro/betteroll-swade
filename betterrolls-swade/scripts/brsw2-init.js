// Init scripts for version 2
import {activate_common_listeners, BRSW_CONST} from './cards_common.js';
import {attribute_card_hooks, activate_attribute_listeners,
    activate_attribute_card_listeners} from './attribute_card.js';
import {skill_card_hooks, activate_skill_listeners,
    activate_skill_card_listeners} from './skill_card.js';
import {activate_result_card_listeners} from "./result_card.js";
import {activate_item_listeners, item_card_hooks,
    activate_item_card_listeners} from "./item_card.js";
import {damage_card_hooks, activate_damage_card_listeners} from "./damage_card.js";

// Startup scripts

// Base Hook
Hooks.on(`ready`, () => {
	console.log('Better Rolls 2 for SWADE | Ready');
	// Create a base object to hook functions
    game.brsw = {};
    attribute_card_hooks();
    skill_card_hooks();
    item_card_hooks();
    damage_card_hooks();
    register_settings_version2();
    // Load partials.
    const templatePaths = ['modules/betterrolls-swade/templates/common_card_header.html',
        'modules/betterrolls-swade/templates/common_card_footer.html',
        'modules/betterrolls-swade/templates/common_options.html',
        'modules/betterrolls-swade/templates/common_more_options.html'];
    loadTemplates(templatePaths).then(() => {
        console.log("Better Rolls templates preloaded")
    });
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
            activate_result_card_listeners(message, html);
        } else if (card_type === BRSW_CONST.TYPE_SKILL_CARD) {
            activate_skill_card_listeners(message, html);
        } else if (card_type === BRSW_CONST.TYPE_ITEM_CARD) {
            activate_item_card_listeners(message, html);
        } else if (card_type === BRSW_CONST.TYPE_DMG_CARD) {
            activate_damage_card_listeners(message, html);
        }
    }
});


// Addon by JuanV, make draggable attacks
Hooks.on('dropCanvasData', (canvas, item) => {
    let grid_size = canvas.scene.data.grid
    canvas.tokens.targetObjects({
        x: item.x-grid_size/2,
        y: item.y-grid_size/2,
        height: grid_size,
        width: grid_size
    });
    item.type = 'Custom';
    eval(item.data.command);
});

// Character sheet hooks

['SwadeCharacterSheet', 'SwadeNPCSheet', 'CharacterSheet'].forEach(name => {
    Hooks.on('render' + name, (app, html, _) => {
        activate_attribute_listeners(app, html);
        activate_skill_listeners(app, html);
        activate_item_listeners(app, html);
    })
})

// Settings

function register_settings_version2() {
    const br_choices = {
        system: game.i18n.localize('BRSW.Default_system_roll'), 
        card: game.i18n.localize('BRSW.Show_Betterrolls_card'),
        trait: game.i18n.localize('BRSW.Show_card_and_trait')};
    game.settings.register('betterrolls-swade', 'click', {
        name: game.i18n.localize('BRSW.Single_click_action'),
        hint: game.i18n.localize('BRSW.Single_click_hint'),
        default: "card",
        scope: "world",
        type: String,
        choices: br_choices,
        config: true
    });
    game.settings.register('betterrolls-swade', 'shift_click', {
        name: game.i18n.localize('BRSW.Shift_click_action'),
        hint: game.i18n.localize('BRSW.Shit_click_hint'),
        default: "system",
        scope: "world",
        type: String,
        choices: br_choices,
        config: true
    });
    game.settings.register('betterrolls-swade', 'ctrl_click', {
        name: game.i18n.localize('BRSW.Control_click_action'),
        hint: game.i18n.localize('BRWS.Control_click_hint'),
        default: "trait",
        scope: "world",
        type: String,
        choices: br_choices,
        config: true
    });
    game.settings.register('betterrolls-swade', 'alt_click', {
        name: game.i18n.localize('BRSW.Alt_click_action'),
        hint: game.i18n.localize('BRSW.Alt_click_hint'),
        default: "system",
        scope: "world",
        type: String,
        choices: br_choices,
        config: true
    });
    game.settings.register('betterrolls-swade', 'result-card', {
        name: game.i18n.localize('BRSW.See_result_card'),
        hint: game.i18n.localize('BRSW.See_result_hint'),
        default: 'all',
        scope: 'world',
        type: String,
        choices: {none: game.i18n.localize('BRSW.No_result_card'),
            master: game.i18n.localize('BRSW.Master_only_result_card'),
            all: game.i18n.localize('BRSW.Everybody')},
        config: true
    });
    // noinspection JSFileReferences
    import('../../dice-so-nice/DiceColors.js').then(dsn => {
    let theme_choice = {};
    // noinspection JSUnresolvedVariable
        for (let theme in dsn.COLORSETS) {
        // noinspection JSUnresolvedVariable
            if (dsn.COLORSETS.hasOwnProperty(theme)) {
            theme_choice[theme] = theme;
        }
    }
    game.settings.register('betterrolls-swade', 'wildDieTheme', {
        name: 'Wild die theme',
        hint: "Choose a theme from Dice So Nice for the Wild Die",
        default: "fire",
        scope: "client",
        type: String,
        choices: theme_choice,
        config: true
    })
	}).catch(()=>{console.log('Dice So Nice not installed')});
}