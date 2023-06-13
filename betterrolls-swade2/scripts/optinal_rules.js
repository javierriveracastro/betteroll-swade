/* globals game, FormApplication */

const OPTIONAL_RULES = ["GrittyDamage", "RiftsGrittyDamage"]

// noinspection JSPrimitiveTypeWrapperUsage
/**
 * Setting for optional rules
 */
export class OptionalRulesConfiguration extends FormApplication {
    static get defaultOptions() {
        let options = super.defaultOptions;
        options.id = 'brsw-optional-rules';
        options.template = "/modules/betterrolls-swade2/templates/optional_rules.html";
        return options;
    }

    getData(_) {
        let rules = [];
        // No idea why the 0...
        let enable_rules = game.settings.get('betterrolls-swade2', 'optional_rules_enabled');
        for (let rule of OPTIONAL_RULES) {
            rules.push({id: rule,
                name: game.i18n.localize("BRSW.OR." + rule),
                enabled: enable_rules.indexOf(rule) > -1});
        }
        let wound_cap = game.settings.get('betterrolls-swade2', 'wound-cap')
        // noinspection JSValidateTypes
        return {rules: rules, wound_cap: wound_cap};
    }

    async _updateObject(_, formData) {
        let enabled = [];
        for (let id in formData) {
            if (formData[id]) {
                enabled.push(id);
            }
        }
        await game.settings.set('betterrolls-swade2', 'optional_rules_enabled', enabled);
        await game.settings.set('betterrolls-swade2', 'wound-cap', formData.wound_cap)
    }
}