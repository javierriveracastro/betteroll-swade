// Definition of the roll clases
/* global game */

import { detect_fumble } from "./cards_common.js";

class Die {
  constructor(data) {
    this.sides = 0;
    this.extra_class = ""; // Extra class for rendering this die
    this.fumble_potential = 1; // 1 = no fumble, 0 = fumble, -1 = critical fumble
    this.raw_total = null; // Number rolled counting explosions
    this.modifiers = 0; // Modifiers to the roll
    this.result = null; // Result (total - target number) usually
    this.label = game.i18n.localize("BRSW.TraitDie");
    if (data) {
      Object.assign(this, data);
    }
  }

  get result_text() {
    if (this.result === null) {
      return "";
    }
    if (this.result < 0) {
      return game.i18n.localize("BRSW.Failure");
    } else if (this.result < 4) {
      return game.i18n.localize("BRSW.Success");
    } else if (this.result < 8) {
      return game.i18n.localize("BRSW.Raise");
    } else {
      const raises = Math.floor(this.result / 4);
      return game.i18n.localize("BRSW.Raise_plural") + " " + raises;
    }
  }

  get result_class() {
    if (this.result === null) {
      return "";
    }
    if (this.result < 0) {
      return "";
    } else if (this.result < 4) {
      return "brsw-green-text";
    } else if (this.result >= 4) {
      return "brsw-blue-text";
    }
    return "";
  }

  get result_icon() {
    if (this.result === null) {
      return "";
    }
    if (this.result < 0) {
      return '<i class="brsw-red-text fas fa-minus-circle"></i>';
    } else if (this.result < 4) {
      return '<i class="brsw-blue-text fas fa-check"></i>';
    } else if (this.result < 8) {
      return '<i class="brsw-blue-text fas fa-check-double"></i>';
    } else {
      const raises = Math.floor(this.result / 4);
      return (
        raises.toString() + '<i class="brsw-blue-text fas fa-check-double"></i>'
      );
    }
  }

  get unexploded() {
    const unexploded_die = [];
    let current_total = this.raw_total;
    let out = false;
    while (!out) {
      if (current_total > this.sides) {
        unexploded_die.push(this.sides);
        current_total -= this.sides;
      } else {
        unexploded_die.push(current_total);
        out = true;
      }
    }
    return unexploded_die;
  }

  get final_total() {
    return this.raw_total + this.modifiers;
  }

  get is_not_discarded() {
    return this.result !== null;
  }
}

class SingleRoll {
  constructor(data) {
    this.dice = [];
    this.is_fumble = false;
    if (data) {
      this.load(data);
    }
  }

  add_roll(roll, wild_die, modifiers) {
    roll.terms.forEach((term) => {
      if (term.hasOwnProperty("faces")) {
        let new_die = new Die(null);
        if (term.total === 1) {
          new_die.extra_class = " brsw-red-text";
          new_die.fumble_potential = -1;
        } else if (term.total > term.faces) {
          new_die.extra_class = " animate-ping";
        }
        new_die.sides = term.faces;
        new_die.raw_total = term.total;
        new_die.modifiers = modifiers;
        this.dice.push(new_die);
      }
    });
    if (wild_die) {
      this.dice[this.dice.length - 1].label =
        game.i18n.localize("SWADE.WildDie");
    }
  }

  async calculate_results(tn, remove_die) {
    let result = 0;
    let minimum_value = 10000000;
    let min_position = 0;
    let fumble_possible = 0;
    for (const [index, roll] of this.dice.entries()) {
      fumble_possible += roll.fumble_potential;
      if (roll.raw_total <= minimum_value) {
        min_position = index;
        minimum_value = roll.raw_total;
      }
      roll.result = roll.final_total - tn;
    }
    this.remove_discarded_die();
    // Mark lower die as discarded.
    if (remove_die && this.dice.length) {
      this.dice[min_position].extra_class += " brsw-discarded-roll";
      this.dice[min_position].result = null;
    }
    this.is_fumble = await detect_fumble(
      remove_die,
      fumble_possible,
      result,
      this.dice,
    );
  }

  remove_discarded_die() {
    for (let die of this.dice) {
      die.extra_class = die.extra_class.replace(/ brsw-discarded-roll/g, "");
    }
  }

  load(data) {
    Object.assign(this, data);
    let new_dice = [];
    for (let die of this.dice) {
      new_dice.push(new Die(die));
    }
    this.dice = new_dice;
  }
}

export class TraitRoll {
  constructor() {
    this.rolls = [];
    this.tn = 4;
    this.tn_reason = "BRSW.Default";
    this.target_id = null;
    this.wild_die = null;
    this.modifiers = [];
    this.selected_roll_index = null;
  }

  get is_rolled() {
    return this.rolls.length > 0;
  }

  /**
   * Adds a Foundry roll to the trait roll
   * @param roll
   */
  async add_roll(roll) {
    const new_roll = new SingleRoll(null);
    new_roll.add_roll(roll, this.wild_die, this.total_modifiers);
    await new_roll.calculate_results(this.tn, this.wild_die);
    this.rolls.push(new_roll);
    this.selected_roll_index = this.rolls.indexOf(new_roll);
  }

  get current_roll() {
    if (this.rolls.length > 0) {
      return this.rolls[this.selected_roll_index];
    }
  }

  get old_rolls() {
    return this.rolls.filter((arr, index) => {
      return index !== this.selected_roll_index;
    });
  }

  get total_modifiers() {
    let total = 0;
    this.modifiers.forEach((mod) => {
      if (mod && mod.value) {
        total += mod.value;
      }
    });
    return total;
  }

  /**
   * Loads data from an object
   * @param data
   */
  load(data) {
    Object.assign(this, data);
    let new_rolls = [];
    for (let roll of this.rolls) {
      new_rolls.push(new SingleRoll(roll));
    }
    this.rolls = new_rolls;
  }

  get rof() {
    if (this.current_roll) {
      const wild_die = this.wild_die ? -1 : 0;
      return this.current_roll.dice.length + wild_die;
    }
  }

  async calculate_results() {
    this._deep_update_modifiers();
    for (let roll of this.rolls) {
      await roll.calculate_results(this.tn, this.wild_die);
    }
  }

  delete_range_modifiers() {
    for (let modifer of this.modifiers) {
      if (modifer.name.startsWith(game.i18n.localize("BRSW.Range"))) {
        this.modifiers.splice(this.modifiers.indexOf(modifer), 1);
      }
    }
  }

  _deep_update_modifiers() {
    for (let roll of this.rolls) {
      for (let die of roll.dice) {
        die.modifiers = this.total_modifiers;
      }
    }
  }
}
