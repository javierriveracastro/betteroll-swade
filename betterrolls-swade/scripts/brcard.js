import {getWhisperData} from "./utils.js";
import {brAction} from "./bsaction.js";

const CARD_TYPES = ['skill', 'weapon', 'power', 'damage', 'raise_damage',
    'damage_and_raise', 'unsupported']

// noinspection JSUnusedGlobalSymbols
export class brCard {
    /**
     *  A class that represents a card created by clicking on an item image
     *
     *  Paramethers:
     *  item: The item that you want to roll
     *  type: The type of card, note that it is not the same as item type
     *      Avaliavel types: skill, weapon, power, damage, raise_damage,
     *          damage_and_raise
     *  overrides: An object with some options that will override item defaults
     *      modifiers: An array of objetcs of type {name: string, value: float}
     *          that will be used as modifiers for the roll
     *      rof: The number of actions to roll, only one wild die will be added
     *      tn: The target number of the action
     *
     *  Methods:
     *  The most interesting method is toMessage that will output the card to
     *  the chat. It accepts a string as paramether, it will be appendend to the
     *  item notes
     */
    constructor(item, type, overrides={}) {
        this.item = item;
        if (! type) {
            this.type = item.type;
        } else {
            this.type = type;
        }
        if (! CARD_TYPES.includes(this.type)) {
            this.type = 'unsupported';
        }
        this.actor = item.actor;
        this.image = item.img;
        this.title = item.name;
        this.notes = item.data.data.notes;
        this.actions = [];
        this.description = item.data.data.description;
        this.bennie_button = true;
        this.damage_button = false;
        this.overrides = overrides;
        this.footer = this.get_item_footer();
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

    overrides_as_data(){
        // Returns the overrides as data properties to use in HTML
        // noinspection JSUnresolvedVariable
        return this.card.overrides ?
            `data-override='${JSON.stringify(this.card.overrides)}'`:''
    }

    async toMessage(extra_notes='') {
        // Trait action
        if (! this.type.includes('unsupported') && ! this.type.includes('damage')) {
            // If it is not a damage roll it includes a trait action
            let item_mod = 0
            if (this.item.data.data.actions) {
                item_mod = parseInt(this.item.data.data.actions.skillMod);
            }
            let modifiers = [];
            if (item_mod)
                modifiers.push({name: this.type, value: item_mod});
            this.actions.push(new brAction(this.item, 'trait', modifiers,
                                           this.overrides))
        }
        // Damage action or button
        // noinspection JSUnresolvedVariable
        if (this.type === 'weapon' || (this.type === 'power'
                && this.item.data.data.damage)) {
            if (! game.settings.get('betterrolls-swade', 'dontRollDamage')) {
                let damage = new brAction(this.item,  'damage', [], this.overrides)
                this.actions.push(damage);
                this.actions.push(
                    new brAction(this.item,  'raise damage',
                                 damage.rolls.map((roll) => {return roll.total}),
                                 this.overrides));
            } else {
                this.damage_button = true;
            }
        } else if (this.type === 'damage') {
            this.actions.push(new brAction(this.item, 'damage'));
        } else if (this.type === 'raise_damage') {
            this.actions.push(new brAction(this.item, 'raise damage'));
        }
        // Bennie button
        if (this.actor.isPC) {
            if (this.actor.data.data.bennies.value < 1) {
                this.bennie_button = false;
            }
        }
        if (extra_notes) {
            if (this.notes) {
                this.notes = `${extra_notes} - ${this.notes}`;
            } else {
                this.notes = extra_notes;
            }
        }
        let content = await renderTemplate(
            "modules/betterrolls-swade/templates/fullroll.html", {
                card: this
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
        await ChatMessage.create(chatData);
    }
}
