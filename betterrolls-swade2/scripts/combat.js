// Functions to control combat flow
/* globals canvas, game */

import {create_unshaken_card, create_unstun_card} from "./remove_status_cards.js";

export async function round_start(combat){
    const token_id = combat.current.tokenId
    const actor = canvas.tokens.get(token_id)?.actor
    if (actor && (actor.system.status.isShaken || actor.system.status.isStunned)) {
        const first_gm = game.users.filter(u => u.isGM)[0]
        if (game.user.id === first_gm.id) {
            if (actor.system.status.isStunned) {
                await create_unstun_card(undefined, token_id);
            } else {
                await create_unshaken_card(undefined, token_id)
            }
        }
    }
}

export async function create_unstun_wrapper(effect) {
    await create_unstun_card(undefined, effect.parent)
}

export async function create_unshaken_wrapper(effect) {
    console.log(effect)
    await create_unshaken_card(undefined, effect.parent)
}