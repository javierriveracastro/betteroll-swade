/* Class to create the complex roll dialog window*/
import {brCard} from "./brcard.js";

export default class ComplexRollApp extends Application {
    constructor(item, options) {
        super(options);
        this.item = item;
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = 'complex-roll';
        options.template = 'modules/betterrolls-swade/templates/complexroll.html';
        options.width = 450;
        options.title = "Betterrolls Complex Roll"
        return options;
    }

    getData(_ = {}) {
        let additional_actions = [];
        let has_damage = false;
        if (this.item.data.data.actions) {
            // noinspection JSUnresolvedVariable
            const additionals = this.item.data.data.actions.additional;
            for (let action in additionals) {
                if (additionals.hasOwnProperty(action)) {
                    if (additionals[action].type === 'skill') {
                        additional_actions.push(
                            {id: action, name: additionals[action].name})
                    }
                }
            }
        }
        if (this.item.data.data.damage) {
            has_damage = true;
        }
        return {item: this.item, rof:this.item.data.data.rof || 1,
            additional_actions: additional_actions, has_damage: has_damage}
    }

    activateListeners(html) {
        html.find('#cancel').click(ev => {
            ev.preventDefault();
            ev.stopPropagation();
            // noinspection JSIgnoredPromiseFromCall,JSCheckFunctionSignatures
            this.close();
        });
        html.find('#roll').click((ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            let overrides = {};
            let modifiers = [];
            let trait_dice = parseInt(html.find('#rof').val()) || 1;
            if (trait_dice > 20) trait_dice = 20;
            overrides.rof = trait_dice
            let modifier_value = parseInt(html.find('#modifier').val());
            if (modifier_value)
                modifiers.push({name: html.find('#mod_name').val(),
                    value: modifier_value})
            let damage_mod_value = parseInt(html.find('#damage_modifier').val());
            if (damage_mod_value) {
                overrides.dmg_mod = [{name: html.find('#dmg_mod_name').val(),
                    value: damage_mod_value}]
            }
            let additional_action = html.find('#additional_actions').val();
            if (additional_action) {
                // noinspection JSUnresolvedVariable
                const actions = this.item.data.data.actions.additional;
                modifiers.push({name: actions[additional_action].name,
                    value: parseInt(actions[additional_action].skillMod) || 0});
                if (actions[additional_action].rof) {
                    overrides.rof = actions[additional_action].rof;
                }
            }
            overrides.tn = parseInt(html.find('#tn').val()) || 4;
            if (modifiers) overrides.modifiers = modifiers;
            const card = new brCard(this.item, '', overrides);
	        // noinspection JSIgnoredPromiseFromCall
            card.toMessage();
	        // noinspection JSIgnoredPromiseFromCall
            this.close();
        })
    }
}
