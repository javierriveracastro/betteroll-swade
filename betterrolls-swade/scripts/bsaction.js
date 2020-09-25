import {broofa, makeExplotable} from "./utils.js";

// noinspection JSUnresolvedVariable
export class brAction {
    /**
     * A class for an action contained in the card like a damage or skill check
     *
     * Allowed types: ['trait', 'damage', 'raise damage]
     */
    constructor(item, type, modifiers=[], overrides={}) {
        // noinspection JSUnusedGlobalSymbols
        this.id = broofa();
        this.item = item;
        this.type = type;
        this.rolls = [];
        // noinspection JSUnusedGlobalSymbols
        this.results = [];
        this.modifiers = [];
        this.total_modifiers = 0;
        // noinspection JSUnusedGlobalSymbols
        this.target_number = overrides.tn || 4;
        // noinspection JSUnusedGlobalSymbols
        this.skill_description = '';
        if ('modifiers' in overrides)
            overrides.modifiers.forEach(modifier => {
                this.add_modifiers(modifier.value, modifier.name);
            })
        // noinspection JSUnusedGlobalSymbols
        this.collapse_result = true;
        // noinspection JSUnresolvedVariable
        let rof = parseInt(this.item.data.data.rof) || 1
        if ('rof' in overrides) rof = overrides.rof
        if (type === 'trait') {
            if (item.type === 'weapon' || item.type === 'power') {
                this.skill = this.get_skill();
                // noinspection JSUnusedGlobalSymbols
                this.skill_description = this.skill? this.skill.data.description: '';
            } else {
                this.skill = this.item.data;
            }
            if (this.skill) {
                this.title = this.skill.name;
            } else {
                this.title = 'No skill found';
            }
            this.rolls = this.trait_roll(rof);
            // noinspection JSUnusedGlobalSymbols
            this.fumble = false;
            // noinspection JSUnusedGlobalSymbols
            this.collapse_result = ! game.settings.get('betterrolls-swade', 'resultRow');
            this.rolls.forEach((roll) => {
                if (roll.extra_classes.includes('brsw-fumble')) { // noinspection JSUnusedGlobalSymbols
                    this.fumble=true;
                }
                if (!roll.extra_classes.includes('discarded')) {
                    this.results.push({total: roll.total - this.total_modifiers, id: broofa()});
                }
            });
        } else {
            // Damage (raise or not)
            let is_raise = false;
            this.title = "Damage";
            if (this.type.includes('raise')) {
                is_raise = true;
                this.title = "Raise damage";
            }
            this.rolls = this.damage_roll(rof, is_raise, modifiers);
        }
    }

    get_skill() {
        /* Gets a skill from a weapon or a power */
        let skill_found;
        let possible_skills = ["untrained", "untrainiert", "desentrenada",
            "non entraine", "non entrainé"];  // True default
        if (this.item.type === "weapon") {
            possible_skills = ["fighting", "kämpfen", "pelear", "combat"];  // Default for weapons
            if (parseInt(this.item.data.data.range) > 0) {
                // noinspection JSUnresolvedVariable
                if (this.item.data.data.damage.includes('str')) {
                    possible_skills = ["athletics", "athletik", "atletismo",
                        "athletisme", "athlétisme"];
                } else {
                    possible_skills = ["shooting", "schiessen", "disparar", "tir"];
                }
            }
        } else if (this.item.type === 'power') {
            possible_skills = ['faith', 'focus', 'spellcasting', `glaube`,
                'fokus', 'zaubern', 'druidism', 'elementalism', 'glamour',
                'heahwisardry', 'hrimwisardry', 'solar magic', 'song magic',
                'soul binding', 'artificer', 'astrology', 'dervish',
                'divination', 'jinn binding', 'khem-hekau', 'mathemagic',
                'sand magic', "sha'ir", 'ship magic', 'ushabti', 'wizir magic',
                'word magic', 'druidenmagie', 'elementarmagie', 'heahmagie',
                'hrimmagie', 'gesangsmagie', 'psiónica', 'psionica', 'fe',
                'hechicería', 'hechiceria', 'foi', 'magie', 'science étrange',
                'science etrange', 'élémentalisme', 'elementalisme', 'druidisme',
                'magie solaire'];
            if (this.item.data.data.arcane) {
                if (possible_skills.includes(
                        this.item.data.data.arcane.toLowerCase())) {
                    possible_skills = this.item.data.data.arcane;
                } else {
                    possible_skills.push(this.item.data.data.arcane.toLowerCase());
                }
            }
        }
        this.item.options.actor.data.items.forEach((skill) => {
            if (possible_skills.includes(skill.name.toLowerCase()) && skill.type === 'skill') {
                skill_found = skill;
            }
        });
        // noinspection JSUnusedAssignment
        return skill_found;
    }

    add_modifiers(modifier, reason) {
        // Add a modifier to a roll string
        // noinspection EqualityComparisonWithCoercionJS
        if (modifier && modifier != 0) {
            this.modifiers.push(
                {reason: reason, value: modifier, positive: (modifier>0)});
            this.total_modifiers = this.total_modifiers + modifier;
        }
    }

    modifiers_string() {
        let string = '';
        this.modifiers.forEach((modifier) => {
            if (modifier.value > 0) {
                string = string + "+" + modifier.value;
            } else if (modifier.value < 0) {
                string = string + "-" + Math.abs(modifier.value);
            }
        });
        return string;
    }

    trait_roll(rof) {
        let die = "4";
        let skill_modifier = -2;
        let wild_die = "6";
        let is_fumble = 0;
        let currentRoll;
        let roll_array = [];
        let roll_results = []
        if (isNaN(rof)) {
            rof = 1
        }
        if (this.skill) {
            die = this.skill.data.die.sides;
            skill_modifier = parseInt(this.skill.data.die.modifier);
            wild_die = this.skill.data['wild-die'].sides;
        }
        for (let i = 0; i < rof; i++) {
            roll_array.push(`1d${die}x=`)
        }
        roll_array.push(`1d${wild_die}x=`);
        this.add_modifiers(skill_modifier, "Skill");
        this.add_modifiers(this.item.options.actor.calcWoundPenalties(), "Wounds");
        this.add_modifiers(this.item.options.actor.calcFatiguePenalties(), "Fatigue");
        this.add_modifiers(this.item.options.actor.calcStatusPenalties(), "Status");
        let minimum_roll = 999999;
        let discarded_index = 999999;
        let dice3d_string = ""
        let dice3d_results = []
        roll_array.forEach((dice_string, index) => {
            dice_string = dice_string + this.modifiers_string();
            currentRoll = new Roll(dice_string);
            currentRoll.roll();
            currentRoll.extra_classes = "";
            if (currentRoll.dice.length === 1 && currentRoll.dice[0].rolls.length === 1
                    && currentRoll.dice[0].rolls[0].roll === 1) {
                is_fumble = is_fumble + 1;
                currentRoll.extra_classes += "brsw-the-one ";
            } else {
                is_fumble = is_fumble - 1;
            }
            currentRoll.dice.forEach((dice) => {
                dice.rolls.forEach((roll) => {
                    dice3d_string = dice3d_string + `d${dice.faces}+`;
                    dice3d_results.push(roll.roll);
                    if (roll.exploded) {
                        currentRoll.extra_classes += "exploded ";
                    }
                })
            })
            roll_results.push(currentRoll)
            if (currentRoll.total < minimum_roll) {
                minimum_roll = currentRoll.total;
                discarded_index = index;
            }
        })
        // Dice so nice, roll all attack dice together
        if (game.dice3d) {
            // noinspection JSIgnoredPromiseFromCall
            game.dice3d.show({
                                 formula: dice3d_string.slice(0, -1),
                                 results: dice3d_results,
                                 whisper: null,
                                 blind: false,
                             }, game.user,true)
        }
        roll_results[roll_results.length - 1].extra_classes +=
            `brsw-d${roll_results[roll_results.length - 1].dice[0].faces} `;
        if (this.item.options.actor.data.data.wildcard) {
            roll_results[discarded_index].extra_classes += "discarded ";
        } else {
            roll_results[roll_results.length - 1].extra_classes += "discarded ";
        }
        if (is_fumble > 0) {
            roll_results.forEach((roll) => {
                roll.extra_classes = roll.extra_classes + "brsw-fumble ";
            })
        }
        return roll_results;
    }

    damage_roll(rof, is_raise=false, modifiers){
        let damage_roll = [];
        for (let i = 0; i < rof; i++) {
            // noinspection JSUnresolvedVariable
            let damage_string = makeExplotable(this.item.data.data.damage);
            if (is_raise) {
                if (game.settings.get('betterrolls-swade', 'dontRollDamage')) {
                    damage_string = damage_string + "+1d6x=";
                } else {
                    damage_string = "1d6x=";
                }
            }
            if (modifiers[i]) {
                this.add_modifiers(modifiers[i], "Base damage");
                damage_string = damage_string + this.modifiers_string();
            }
            let damage = new Roll(damage_string,
                                  this.item.actor.getRollShortcuts());
            damage.roll();
            if (game.dice3d) {
                // noinspection JSIgnoredPromiseFromCall
                game.dice3d.showForRoll(damage, game.user, true)
            }
            damage_roll.push(damage)
        }
        let ap_int = parseInt(this.item.data.data.ap)
        if (ap_int && ap_int > 0) {
            this.title = this.title + ` (AP: ${this.item.data.data.ap})`;
        }
        return  damage_roll
    }

}
