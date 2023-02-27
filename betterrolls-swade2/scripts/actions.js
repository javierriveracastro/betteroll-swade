// Common actions stuff (item and global actions)


export class brAction {

    constructor(name, code) {
        this.name = name
        this.code = code
        this.selected = false
        this.collapsed = false
        this.has_skill_mod = !!(this.code.skillMod || this.code.skillOverride)
        this.has_damage_mod = !!(this.code.damageMod || this.code.damageOverride);
    }
}