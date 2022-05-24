// Functions to control combat flow
/* globals canvas */

import {create_unshaken_card} from "./unshake_card.js";

export async function round_start(combat){
    const token_id = combat.current.tokenId
    const actor = canvas.tokens.get(token_id).actor
    if (actor.data.data.status.isShaken) {
        await create_unshaken_card(undefined, token_id)
    }
}