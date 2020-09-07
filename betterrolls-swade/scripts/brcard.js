import {getWhisperData} from "./utils.js";
import {brAction} from "./bsaction.js";

const CARD_TYPES = ['skill', 'weapon', 'power', 'damage', 'raise_damage',
    'damage_and_raise', 'unsupported']

// noinspection JSUnusedGlobalSymbols
export class brCard {
    /**
     *  A class that represents a card created by clicking on an item image
     */
    constructor(item, type, extra_data={}) {
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
        this.extradata = extra_data
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

    async toMessage(extra_notes='') {
        if (! this.type.includes('unsupported') && ! this.type.includes('damage')) {
            // If it is not a damage roll it includes a trait action
            this.actions.push(new brAction(this.item, 'trait', [],
                                           this.extradata))
        }
        // noinspection JSUnresolvedVariable
        if (this.type === 'weapon' || (this.type === 'power'
                && this.item.data.data.damage)) {
            if (! game.settings.get('betterrolls-swade', 'dontRollDamage')) {
                let damage = new brAction(this.item,  'damage')
                this.actions.push(damage);
                this.actions.push(
                    new brAction(this.item,  'raise damage',
                                 damage.rolls.map((roll) => {return roll.total})));
            } else {
                this.damage_button = true;
            }
        } else if (this.type === 'damage') {
            this.actions.push(new brAction(this.item, 'damage'));
        } else if (this.type === 'raise_damage') {
            this.actions.push(new brAction(this.item, 'raise damage'));
        }
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
        // Results are part of the action.
        // let id_result = ''
        // if (game.settings.get('betterrolls-swade', 'resultRow') && result) {
        //     id_result = broofa();
        // }
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
