// Functions to control combat flow
/* globals canvas, game */

import {create_unshaken_card} from "./unshake_card.js";

export async function round_start(combat){
    const token_id = combat.current.tokenId
    const actor = canvas.tokens.get(token_id).actor
    if (actor.data.data.status.isShaken) {
        const first_gm = game.users.filter(u => u.isGM)[0]
        if (game.user.id === first_gm.id) {
            await create_unshaken_card(undefined, token_id);
        }
    }
}