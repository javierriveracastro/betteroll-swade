
const OPTIONAL_RULES = ["GrittyDamage"]

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
        let enable_rules = game.settings.get('betterrolls-swade2', 'optional_rules_enabled')[0];
        for (let rule of OPTIONAL_RULES) {
            rules.push({id: rule,
                name: game.i18n.localize("BRSW.OR." + rule),
                enabled: enable_rules.indexOf(rule) > -1});
        }
        // noinspection JSValidateTypes
        return {rules: rules};
    }

    async _updateObject(_, formData) {
        let enabled = [];
        for (let id in formData) {
            if (formData[id]) {
                enabled.push(id);
            }
        }
        game.settings.set('betterrolls-swade2', 'optional_rules_enabled', enabled);
    }
}