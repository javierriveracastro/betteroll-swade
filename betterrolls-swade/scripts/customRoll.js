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
        let ability = "Fighting"  // Default
        if (parseInt(this.item.data.data.range) > 0) {
            // noinspection JSUnresolvedVariable
            if (this.item.data.data.damage.includes('str')) {
                ability = "Athletics"
            } else {
                ability = "Shooting"
            }
        }
        return ability
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
        let die = "4"
        let skill_modifier = "-2"
        let wild_die = "6"
        let attack_array = []
        let roll_string = ''
        let currentRoll
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
        if (this.item.options.actor.data.data.wildcard) {
            attack_array.push(`1d${wild_die}x=`);
        }
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
            currentRoll.dice.forEach((dice) => {
                dice.rolls.forEach((roll) => {
                    nice_string = nice_string + `d${dice.faces}+`;
                    nice_results.push(roll.roll);
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
        attack_rolls[discarded_index].discarded = true
        let array_show = attack_rolls.slice()
        if (array_show.length > 1) {
            array_show.splice(discarded_index, 1)
        }
        return  {
            roll_title: 'Attack', rolls: attack_rolls,
            rolls_accepted: array_show
        };
    }

    damage_roll(rof, add_raise=false){
        let damage_rolls = []
        for (let i = 0; i < rof; i++) {
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
        return  {
            roll_title: title, rolls: damage_rolls,
            rolls_accepted: damage_rolls
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
        return  {
            roll_title: 'Raise damage',
            rolls: raise_damage_rolls,
            rolls_accepted: raise_damage_rolls
        };

    }

    // noinspection JSUnusedGlobalSymbols
    generate_attack_card(){
        /// Generate an attack card
        let parts = []
        let separate_damage = game.settings.get('betterrolls-swade',
                                                'dontRollDamage');
        let rof = parseInt(this.item.data.data.rof) || 1;
        console.log(rof);
        parts.push(this.attack_roll(rof));
        if (! separate_damage) {
            let damage_roll = this.damage_roll(rof);
            parts.push(damage_roll);
            // Raise damage
            parts.push(this.damage_raise_roll(damage_roll));
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

    async toMessage(card_type) {
        /// Creates a card rolling dice
        /// @param card_type: generate_attack_card for a normal attack
        let [parts, separate_damage] = this[card_type]()
        let bennies_available = true;
        if (this.actor.isPC) {
            if (this.actor.data.data.bennies.value < 1) {
                bennies_available = false
            }
        }
        let content = await renderTemplate(
            "modules/betterrolls-swade/templates/fullroll.html", {
                parts: parts, title: this.item.name,
                description: this.item.data.data.notes ||
                    this.item.data.data.description,
                item_id: this.item.id,
                actor_id: this.actor.id,
                bennies_available: bennies_available,
                damage_buttons: separate_damage,
                card_type: card_type
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
