/* Class to create the complex roll dialog window*/
import {brCard} from "./brcard.js";

export default class ComplexRollApp extends Application {
    constructor(item, options) {
        super(options);
        this.item = item;
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = 'complex-roll';
        options.template = 'modules/betterrolls-swade/templates/complexroll.html';
        options.width = 380;
        options.title = "Betterrolls Complex Roll"
        return options;
    }

    getData(_ = {}) {
        return {item: this.item, rof:this.item.data.data.rof || 1}
    }

    activateListeners(html) {
        html.find('#cancel').click(ev => {
            ev.preventDefault();
            ev.stopPropagation();
            // noinspection JSIgnoredPromiseFromCall
            this.close();
        });
        html.find('#roll').click((ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            let trait_dice = parseInt(html.find('#rof').val()) || 1
            if (trait_dice > 30) trait_dice = 30;
            const card = new brCard(this.item, '', {rof: trait_dice});
	        // noinspection JSIgnoredPromiseFromCall
            card.toMessage();
	        // noinspection JSIgnoredPromiseFromCall
            this.close();
        })
    }
}
