import {getWhisperData, makeExplotable} from "./utils.js";

export class CustomRoll {
    /**
     * The base function fot custom roll.s
     */
    constructor(item) {
        this.actor = item.actor;
        this.item = item
    }

    get_skill() {
        /* Returns the ability used for this item */
        let skill_found = "Untrained";
        let possible_skills = ["untrained", "untrainiert"];  // True default
        if (this.item.type === "weapon") {
            possible_skills = ["fighting", "kämpfen"];  // Default for weapons
            if (parseInt(this.item.data.data.range) > 0) {
                // noinspection JSUnresolvedVariable
                if (this.item.data.data.damage.includes('str')) {
                    possible_skills = ["athletics", "athletik"];
                } else {
                    possible_skills = ["shooting", "schiessen"];
                }
            }
        } else if (this.item.type === 'power') {
            possible_skills = ['faith', 'focus', 'spellcasting', `glaube`,
                'fokus', 'zaubern'];
        }
        this.item.options.actor.data.items.forEach((skill) => {
            if (possible_skills.includes(skill.name.toLowerCase())) {
                skill_found = skill.name;
            }
        });
        return skill_found
    }

    get_item_footer(){
        let footer = [];
        if (this.item.type === "weapon"){
            footer.push("Range: " +  this.item.data.data.range);
            // noinspection JSUnresolvedVariable
            footer.push("Rof: "+ this.item.data.data.rof);
            // noinspection JSUnresolvedVariable
            footer.push("Damage: " + this.item.data.data.damage);
            footer.push("AP: " + this.item.data.data.ap);
        } else if (this.item.type === "power"){
            // noinspection JSUnresolvedVariable
            footer.push("PP: " + this.item.data.data.pp);
            footer.push("Range: " + this.item.data.data.range);
            footer.push("Duration: " + this.item.data.data.duration);
            // noinspection JSUnresolvedVariable
            if (this.item.data.data.damage) {
                // noinspection JSUnresolvedVariable
                footer.push("Damage: " + this.item.data.data.damage);
            }
        }
        return footer
    }

    add_modifiers(roll_string, modifier) {
        // Add a modifier to a roll string
        if (modifier > 0) {
            roll_string = roll_string + "+" + modifier;
        } else if (modifier < 0) {
            roll_string = roll_string + "-" + Math.abs(modifier);
        }
        return roll_string;
    }

    attack_roll(rof) {
        // Create a part for the attack roll
        let skill = this.get_skill();
        let die = "4";
        let skill_modifier = "-2";
        let wild_die = "6";
        let attack_array = [];
        let roll_string = '';
        let is_fumble = 0;
        let currentRoll;
        if (isNaN(rof) || rof < 1) {
            rof = 1
        }
        this.item.options.actor.data.items.forEach((item) => {
            if (item.name === skill) {
                die = item.data.die.sides;
                skill_modifier = parseInt(item.data.die.modifier);
                wild_die = item.data['wild-die'].sides;
            }
        })
        for (let i = 0; i < rof; i++) {
            attack_array.push(`1d${die}x=`)
        }
        attack_array.push(`1d${wild_die}x=`);
        let attack_rolls = [];
        let minimum_roll = 999999;
        let discarded_index = 999999;
        let nice_string = ""
        let nice_results = []
        attack_array.forEach((dice_string, index) => {
            roll_string = dice_string
            roll_string = this.add_modifiers(roll_string, skill_modifier)
            // Wounds and fatigue
            if (typeof this.item.options.actor.calcWoundFatigePenalties
                !== 'undefined') {
                roll_string = this.add_modifiers(
                    roll_string, this.item.options.actor.calcWoundFatigePenalties())
            } else {
                roll_string = this.add_modifiers(
                    roll_string, this.item.options.actor.calcWoundPenalties())
                roll_string = this.add_modifiers(
                    roll_string, this.item.options.actor.calcFatiguePenalties())
            }
            roll_string = this.add_modifiers(
                roll_string, this.item.options.actor.calcStatusPenalties())
            currentRoll = new Roll(roll_string);
            currentRoll.roll()
            currentRoll.extra_classes = ""
            if (parseInt(currentRoll.result) === 1) {
                is_fumble = is_fumble + 1;
            } else {
                is_fumble = is_fumble - 1;
            }
            console.log("BRWSADE");
            console.log(currentRoll);
            currentRoll.dice.forEach((dice) => {
                dice.rolls.forEach((roll) => {
                    nice_string = nice_string + `d${dice.faces}+`;
                    nice_results.push(roll.roll);
                    if (roll.exploded) {
                        currentRoll.extra_classes += "exploded "
                    }
                })
            })
            // Dice so nice, roll all attack dice together
            attack_rolls.push(currentRoll)
            if (currentRoll.total < minimum_roll) {
                minimum_roll = currentRoll.total
                discarded_index = index
            }
        })
        if (game.dice3d) {
            // noinspection JSIgnoredPromiseFromCall
            game.dice3d.show({
                                 formula: nice_string.slice(0, -1),
                                 results: nice_results
                             })
        }
        if (is_fumble > 0) {
            attack_rolls.forEach((roll) => {
                roll.extra_classes = roll.extra_classes + "brsw-fumble "
            })
        }
        console.log('BRSWADE');
        console.log(attack_rolls[attack_rolls.length - 1]);
        attack_rolls[attack_rolls.length - 1].extra_classes +=
            `brsw-d${attack_rolls[attack_rolls.length - 1].dice[0].faces} `;
        if (this.item.options.actor.data.data.wildcard) {
            attack_rolls[discarded_index].extra_classes += "discarded "
        } else {
            attack_rolls[attack_rolls.length - 1].extra_classes += "discarded "
        }
        return  {
            roll_title: skill, rolls: attack_rolls
        };
    }

    damage_roll(rof, add_raise=false){
        let damage_rolls = []
        for (let i = 0; i < rof; i++) {
            // noinspection JSUnresolvedVariable
            let damage_string = makeExplotable(this.item.data.data.damage);
            if (add_raise) {damage_string = damage_string + "+1d6x="}
            let damage = new Roll(damage_string,
                                  this.item.actor.getRollShortcuts());
            damage.roll();
            if (game.dice3d) {
                // noinspection JSIgnoredPromiseFromCall
                game.dice3d.showForRoll(damage)
            }
            damage_rolls.push(damage)
        }
        let title = "Damage";
        if (add_raise) {
            title = "Damage with raise";
        }
        let ap_int = parseInt(this.item.data.data.ap)
        if (ap_int && ap_int > 0) {
            title = title + ` (AP: ${this.item.data.data.ap})`;
        }
        return  {
            roll_title: title, rolls: damage_rolls
        };
    }

    damage_raise_roll(damage_roll) {
        let raise_damage_rolls = []
        damage_roll.rolls.forEach((damage) => {
            let raise_damage_roll = new Roll(`${damage.total}+1d6x=`);
            raise_damage_roll.roll()
            if (game.dice3d) {
                // noinspection JSIgnoredPromiseFromCall
                game.dice3d.showForRoll(raise_damage_roll)
            }
            raise_damage_rolls.push(raise_damage_roll)
        })
        let title = 'Raise damage';
        let ap_int = parseInt(this.item.data.data.ap)
        if (ap_int && ap_int > 0) {
            title = title + ` (AP: ${this.item.data.data.ap})`;
        }
        return  {
            roll_title: title,
            rolls: raise_damage_rolls
        };

    }

    // noinspection JSUnusedGlobalSymbols
    generate_attack_card(){
        /// Generate an attack card
        let parts = []
        let separate_damage = game.settings.get('betterrolls-swade',
                                                'dontRollDamage');
        // noinspection JSUnresolvedVariable
        let rof = parseInt(this.item.data.data.rof) || 1;
        parts.push(this.attack_roll(rof));
        if (! separate_damage) {
            let damage_roll = this.damage_roll(rof);
            parts.push(damage_roll);
            // Raise damage
            parts.push(this.damage_raise_roll(damage_roll));
        }
        return [parts, separate_damage]
    }

    generate_power_card(){
        let parts = []
        parts.push(this.attack_roll(1))
        let separate_damage = false
        // noinspection JSUnresolvedVariable
        if (this.item.data.data.damage) {
            separate_damage = game.settings.get('betterrolls-swade',
                                                'dontRollDamage');
            if (! separate_damage) {
                let damage = this.damage_roll(1);
                parts.push(damage);
                parts.push(this.damage_raise_roll(damage));
            }
        }
        return [parts, separate_damage]
    }

    // noinspection JSUnusedGlobalSymbols
    generate_damage_card() {
        let parts = [];
        parts.push(this.damage_roll(1));
        return [parts, false];
    }

    // noinspection JSUnusedGlobalSymbols
    generate_raise_dmg_card() {
        let parts = [];
        let damage = this.damage_roll(1);
        parts.push(damage);
        parts.push(this.damage_raise_roll(damage));
        return [parts, false];
    }

    // noinspection JSUnusedGlobalSymbols
    generate_damage_and_raise_card() {
        let parts = [];
        parts.push(this.damage_roll(1, true));
        return [parts, false]
    }

    async toMessage(card_type, extra_notes='') {
        /// Creates a card rolling dice
        /// @param card_type: generate_attack_card for a normal attack
        let [parts, separate_damage] = this[card_type]()
        let bennies_available = true;
        let notes = this.item.data.data.notes;
        if (this.actor.isPC) {
            if (this.actor.data.data.bennies.value < 1) {
                bennies_available = false
            }
        }
        if (extra_notes) {
            if (notes) {
                notes = `${extra_notes} - ${notes}`;
            } else {
                notes = extra_notes;
            }
        }
        let content = await renderTemplate(
            "modules/betterrolls-swade/templates/fullroll.html", {
                parts: parts, title: this.item.name ,
                notes: notes,
                description:  this.item.data.data.description,
                item_id: this.item.id,
                actor_id: this.actor.id,
                bennies_available: bennies_available,
                damage_buttons: separate_damage,
                card_type: card_type,
                footer: this.get_item_footer()
            });
        let whisper_data = getWhisperData();
        let chatData = {
            user: game.user._id,
            content: content,
            speaker: {
                actor: this.actor._idx,
                token: this.actor.token,
                alias: this.actor.name
            },
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            roll: new Roll("0").roll(),
            rollMode: whisper_data.rollMode,
            blind: whisper_data.blind
        }
        if (whisper_data.whisper) {
            chatData.whisper = whisper_data.whisper
        }
        /* TODO whisper settings */
        await ChatMessage.create(chatData);
    }
}
