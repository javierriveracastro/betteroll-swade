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
        // noinspection JSUnusedGlobalSymbols
        this.damage_results = [];
        this.modifiers = [];
        this.total_modifiers = 0;
        // noinspection JSUnusedGlobalSymbols
        this.skill_description = '';
        modifiers.forEach(modifier => this.add_modifiers(
            modifier.value, modifier.name));
        if ('modifiers' in overrides && this.type === 'trait')
            overrides.modifiers.forEach(modifier => {
                this.add_modifiers(modifier.value, modifier.name);
            })
        // noinspection JSUnusedGlobalSymbols
        this.collapse_result = ! game.settings.get('betterrolls-swade', 'resultRow');
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
            this.rolls = this.damage_roll(rof, is_raise, modifiers, overrides.dmg_mod);
            this.rolls.forEach(roll => {
                this.damage_results.push({total: roll.total - this.total_modifiers, id: broofa()});
            })
        }
        // noinspection JSUnusedGlobalSymbols
        this.target_number = overrides.tn || this.target_number || 4;
    }

    check_skill_in_actor(possible_skills) {
        /**
         * See if some skill in an array exist in an actor an return it
         */
        let skill_found = '';
        this.item.options.actor.data.items.forEach((skill) => {
            if (possible_skills.includes(skill.name.toLowerCase()) && skill.type === 'skill') {
                skill_found = skill;
            }
        });
        return skill_found;
    }

    get_skill() {
        /* Gets a skill from a weapon or a power */
        const fighting_skills = ["fighting", "kämpfen", "pelear", "combat"];
        let skill_found;
        // If the item has a skill either in arcane or in the action tab
        // try to find it
        let possible_skills = [];
        if (this.item.data.data.arcane)  possible_skills.push(
            this.item.data.data.arcane.toLowerCase());
        if (this.item.data.data.actions) {
            if (this.item.data.data.actions.skill) {
                possible_skills.push(this.item.data.data.actions.skill.toLowerCase());
            }
        }
        skill_found = this.check_skill_in_actor(possible_skills);
        if (! skill_found) {
            // If not we are back to guessing
            if (this.item.type === "weapon") {
                possible_skills = fighting_skills;  // Default for weapons
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
            }
            // noinspection JSUnusedAssignment
            skill_found = this.check_skill_in_actor(possible_skills);
            if (! skill_found) {
                const untrained = ["untrained", "untrainiert", "desentrenada",
                    "non entraine", "non entrainé"];
                skill_found = this.check_skill_in_actor(untrained)
            }
        }
        if (skill_found) {
            if (fighting_skills.includes(skill_found.name.toLowerCase()))
                this.set_parry_as_difficulty();
        }
        return skill_found
    }

    set_parry_as_difficulty(){
        /**
         * Sets the difficulty as the parry value of the targeted
         * or selected token
         */
        let targets = game.user.targets;
        let objective;
        let target_number;
        if (targets.size) objective = Array.from(targets)[0];
        if (objective) {
            target_number = parseInt(objective.actor.data.data.stats.parry.value)
        }
        this.target_number = target_number || 4;
    }

    add_dice_tray_modifier(){
        let tray_modifier = parseInt($("input.dice-tray__input").val());
        if (tray_modifier) {
            this.add_modifiers(tray_modifier, "Dice tray");
        }
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
        this.add_dice_tray_modifier();
        let minimum_roll = 999999;
        let discarded_index = 999999;
        let dice3d_die = [{dice:[]}]
        roll_array.forEach((dice_string, index) => {
            dice_string = dice_string + this.modifiers_string();
            currentRoll = new Roll(dice_string);
            currentRoll.roll();
            currentRoll.extra_classes = "";
            if (currentRoll.dice.length === 1 && currentRoll.dice[0].rolls.length === 1
                    && currentRoll.dice[0].rolls[0].result === 1) {
                is_fumble = is_fumble + 1;
                currentRoll.extra_classes += "brsw-the-one ";
            } else {
                is_fumble = is_fumble - 1;
            }
            currentRoll.dice.forEach((dice) => {
                let roll_index = 0;
                dice.rolls.forEach((roll) => {
                    if (game.dice3d) {
                        dice3d_die[roll_index].dice.push(
                            {resultLabel: roll.result, result: roll.result,
                                type: `d${dice.faces}`,
                                options: index<roll_array.length - 1?{}:
                                    {'colorset': game.settings.get(
                                        'betterrolls-swade', 'wildDieTheme')},
                                vectors: []});
                    }
                    if (roll.exploded) {
                        roll_index += 1;
                        if (roll_index >= dice3d_die.length) dice3d_die.push({dice:[]});
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
            game.dice3d.show({throws: dice3d_die}, game.user,true)
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

    damage_roll(rof, is_raise=false, modifiers, dmg_modifiers){
        let damage_roll = [];
        let damage_string = makeExplotable(this.item.data.data.damage);
        if (dmg_modifiers) {
            dmg_modifiers.forEach(mod => {
                this.add_modifiers(mod.value, mod.name)
            });
        }
        if (this.item.data.data.actions) {
            if (this.item.data.data.actions.dmgMod) {
                let dmg_item_mod = this.item.data.data.actions.dmgMod;
                this.add_modifiers(parseInt(dmg_item_mod), 'weapon')
            }
        }
        damage_string = damage_string +this.modifiers_string()
        if (is_raise) {
            if (game.settings.get('betterrolls-swade', 'dontRollDamage')) {
                damage_string = damage_string + "+1d6x=";
            } else {
                damage_string = "1d6x=";
            }
        }
        if (game.settings.get('betterrolls-swade', 'dontRollDamage')) rof=1;
        for (let i = 0; i < rof; i++) {
            // noinspection JSUnresolvedVariable
            let base_damage = '';
            if (is_raise &&
                   ! game.settings.get('betterrolls-swade', 'dontRollDamage')) {
                if (modifiers[i]) {
                    base_damage = `+${modifiers[i]}`;
                }
            }
            let damage = new Roll(damage_string + base_damage,
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
