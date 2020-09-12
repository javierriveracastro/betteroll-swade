// Utility functions that can be used out of the module

export function getWhisperData() {
    let rollMode, whisper, blind
    rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) whisper = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "blindroll") blind = true;
    else if (rollMode === "selfroll") whisper = [game.user._id];
    let output = {
        rollMode: rollMode,
        whisper: whisper,
        blind: blind
    };
    return output;
}

export function makeExplotable(expresion) {
    // Make all dice of a roll able to explode
    // Code from the SWADE system
    const reg_exp = /\d*d\d+[^kdrxc]/g;
    expresion = expresion + ' '; // Just because of my poor reg_exp foo
    let dice_strings = expresion.match(reg_exp);
    let used = [];
    if (dice_strings) {
        dice_strings.forEach((match) => {
            if (used.indexOf(match) === -1) {
                expresion = expresion.replace(new RegExp(match.slice(0, -1), 'g'),
                                              match.slice(0, -1) + "x=");
                used.push(match);
            }
        })
    }
    return expresion;
}

export function spendMastersBenny() {
    // Expends one benny from the master stack
    game.users.forEach((user) => {
        if (user.isGM) {
            let value = user.getFlag('swade', 'bennies');
            // noinspection JSIgnoredPromiseFromCall
            user.setFlag('swade', 'bennies', value - 1);
        }
    })
}

export function broofa() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}
