// Patches SWADEActor.
/* globals foundry, game, getDocumentClass, setProperty */

import SwadeActor from "../../../systems/swade/module/documents/actor/SwadeActor.js";

/**
 * We monkey patch swade actor to have a new property
 */
export function patch_actor() {
    if (SwadeActor.hasOwnProperty('toggleActiveEffect')) {return}
    SwadeActor.prototype.toggleActiveEffect = toggleActiveEffect
}

/**
 * Toggle an active effect in one actor
 * @param effect: The Active Effect to toggle
 * @param {Object} options: The same object that is passed to
 *  token.toggleActiveEffect, mainly {active: if it is active,
 *  overlay: for big icon}
 */
async function toggleActiveEffect(effect,  options = {}) {
    const active_tokens = this.getActiveTokens()
    if (active_tokens.length) {
        await active_tokens[0].document.toggleActiveEffect(effect, options)
        return
    }
    const current_effects = this.effects.find(eff => eff.getFlag('core', 'statusId') === effect.id)
    if (current_effects && !options.active) {
        // Delete the effect
        current_effects.delete()
    } else if (!current_effects && options.active) {
        // Create the effect
        const new_effect = foundry.utils.deepClone(effect)
        new_effect.label = game.i18n.localize(new_effect.label)
        setProperty(new_effect, 'flags.core.statusId', effect.id)
        new_effect.id = undefined
        const doc_class = getDocumentClass('ActiveEffect')
        await doc_class.create(new_effect, {parent: this})
    }
}