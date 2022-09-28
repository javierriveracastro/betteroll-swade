/* globals FormApplication, game */

/**
 * Settings configuration for modifier names
 */
export class ModifierSettingsConfiguration extends FormApplication {
    static get defaultOptions() {
        let options = super.defaultOptions;
        options.id = 'brsw-modifier-names';
        options.template = "/modules/betterrolls-swade2/templates/modifier_names_settings.html";
        return options;
    }

    getData(_) {
        let chat_modifiers_names = game.settings.get('betterrolls-swade2', 'chat_modifiers_names');
        // noinspection JSValidateTypes
        return {names: chat_modifiers_names};
    }

    async _updateObject(_, formData) {
        await game.settings.set('betterrolls-swade2', 'chat_modifiers_names', formData);
    }
}

export function changeNames(){
    const new_names =  game.settings.get('betterrolls-swade2', 'chat_modifiers_names');
    for (let prefix of ['GM', 'Trait', 'Damage', 'ROF']) {
        if (new_names[prefix]) {
            const element = document.getElementById(`brsw-mods-${prefix}-label`)
            if (element) {
                element.innerHTML = new_names[prefix];
            }
        }
    }
}