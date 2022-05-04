// Scripts to manage gm selectors
/* globals game */

/**
 * Gm modifiers have been checked
 * @param ev
 */
export function manage_selectable_gm(ev) {
    const initial_status = ! ev.currentTarget.classList.contains('brws-selected')
    const value = parseInt(ev.currentTarget.dataset.value)
    ev.currentTarget.classList.toggle('brws-permanent-selected')
    ev.currentTarget.classList.toggle('brws-selected')
    let value_list = game.settings.get('betterrolls-swade2', 'gm_modifiers')
    let indice = value_list.indexOf(value)
    if (indice >= 0 && !initial_status) {
        value_list.splice(indice, 1)
    } else if (indice === -1 && initial_status) {
        value_list.push(value)
    }
    game.settings.set('betterrolls-swade2', 'gm_modifiers', value_list)
}

/**
 * Register the settings used to store the gm modifiers
 */
export function register_gm_modifiers_settings() {
    game.settings.register('betterrolls-swade2', 'gm_modifiers', {
        name: "GM Modifiers",
        default: [],
        type: Array,
        scope: "world",
        config: false
    });
}