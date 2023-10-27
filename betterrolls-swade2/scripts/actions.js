// Common actions stuff (item and global actions)

import { broofa } from "./utils.js";

export class brAction {
  constructor(name, code, type) {
    this.name = name;
    if (type === "item") {
      this.code = JSON.parse(JSON.stringify(code));
      this.code.id = broofa();
      if (this.code.type == "macro") {
        this.type = "macro";
      }
    } else {
      this.code = code;
    }
    this.selected = false;
    this.recreate_skill_damage_mods();
    this.has_skill_mod = !!(this.code.skillMod || this.code.skillOverride);
    this.has_damage_mod = !!(this.code.dmgMod || this.code.dmgOverride);
  }

  recreate_skill_damage_mods() {
    // Since SWADE 3.1 modifiers to trait and damage roll no longer share
    // the same syntax with Global Actions. So we need to recreate them
    if (this.code.hasOwnProperty("modifier")) {
      // Post SWADE 3.1 action
      this.code = JSON.parse(JSON.stringify(this.code));
      if (this.code.type === "trait") {
        this.code.skillMod = this.code.modifier;
      } else if (this.code.type === "damage") {
        this.code.dmgMod = this.code.modifier;
        this.code.dmgOverride = this.code.override;
      }
    }
  }
}
