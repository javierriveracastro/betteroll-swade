// Common actions stuff (item and global actions)


export class brAction {

    constructor(name, code) {
        this.name = name
        this.code = code
        this.selected = false
    }

    get has_skill_mod() {
        return !!(this.code.skillMod || this.code.skillOverride);
    }

    get has_damage_mod() {
        return !!(this.code.damageMod || this.code.damageOverride);
    }
}