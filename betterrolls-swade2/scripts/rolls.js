// Definition of the roll clases
/* global game */

import {detect_fumble} from "./cards_common.js";

class Die {
    constructor() {
        this.sides = 0;
        this.extra_class = ''; // Extra class for rendering this die
        this.fumble_potential = 1; // 1 = no fumble, 0 = fumble, -1 = critical fumble
        this.total = null; // Number rolled counting explosions
        this.result = null; // Result (total - target number) usually
        this.label = 'Trait Die'
    }
    
    result_text_icon() {
        const return_value = {text: '', icon: ''};
        if (!this.result) {
            return return_value;
        }
        if (this.result < 0) {
            return_value.text = game.i18n.localize('BRSW.Failure');
            return_value.icon = '<i class="brsw-red-text fas fa-minus-circle"></i>'
        } else if (this.result < 4) {
            return_value.text = game.i18n.localize('BRSW.Success');
            return_value.icon = '<i class="brsw-blue-text fas fa-check"></i>'
        } else if (this.result < 8) {
            return_value.text = game.i18n.localize('BRSW.Raise');
            return_value.icon = '<i class="brsw-blue-text fas fa-check-double"></i>'

        } else {
            const raises = Math.floor(this.result / 4)
            return_value.text = game.i18n.localize('BRSW.Raise_plural') + ' ' + raises;
            return_value.icon = raises.toString() + '<i class="brsw-blue-text fas fa-check-double"></i>';

        }
    }
}

class SingleRoll {
    constructor() {
        this.dice = [];
        this.is_fumble = false;
        this.result = null;
    }

    add_roll(roll, wild_die) {
         roll.terms.forEach((term) => {
            if (term.hasOwnProperty('faces')) {
                let new_die = new Die();
                if (term.total === 1) {
                    new_die.extra_class = ' brsw-red-text';
                    new_die.fumble_potential = -1;
                } else if (term.total > term.faces) {
                    new_die.extra_class = ' brsw-blue-text';
                }
                new_die.sides = term.faces;
                new_die.total = term.total;
                this.dice.push(new_die);
            }
        })
        if (wild_die) {
            this.dice[this.dice.length - 1].label = game.i18n.localize("SWADE.WildDie");
        }
    }

    calculate_results(tn, remove_die) {
        let result = 0;
        let minimum_value = 10000000
        let min_position = 0
        let fumble_possible = 0
        for (const [index, roll] of this.dice.entries()) {
            fumble_possible += roll.fumble_potential
            if (roll.total <= minimum_value) {
                min_position = index
                minimum_value = roll.result
            }
            roll.result = roll.total - tn;
        }
        // Remove lower die.
        if (remove_die && this.dice.length) {
            this.dice[min_position].extra_class += ' brsw-discarded-roll';
            this.dice[min_position].result = null;
        }
        if (result < 0) {
            result = 0
        } else if (result === 0) {
            result = 0.01  // Ugly hack to differentiate from failure
        }
        this.is_fumble = detect_fumble(remove_die, fumble_possible, result, this.dice);
    }
}

export class TraitRoll {
    constructor() {
        this.rolls = [];
        this.tn = 4;
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
    add_roll(roll) {
        const new_roll = new SingleRoll();
        new_roll.add_roll(roll, this.wild_die);
        new_roll.calculate_results(this.tn, this.wild_die);
        this.rolls.push(new_roll);
        this.selected_roll_index = this.rolls.indexOf(new_roll);
    }
    
    current_roll() {
        return this.rolls[this.selected_roll_index];
    }
}