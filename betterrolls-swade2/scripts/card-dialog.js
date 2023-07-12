// A dialog to manage br cards
/* global game, console, renderTemplate */

import {BrCommonCard} from "./cards_common.js";

export function setup_dialog() {
    let dialog_element = document.createElement('dialog')
    dialog_element.setAttribute('id', 'br-card-dialog')
    dialog_element.classList.add('bg-gray-700')
    document.body.insertAdjacentElement('beforeend', dialog_element)
    game.brsw.dialog = new BrCardDialog()
}

class BrCardDialog {

    constructor() {
        this.BrCard = null
    }

    get dialog_element() {
        return document.getElementById('br-card-dialog')
    }

    show_card(message) {
        this.BrCard = new BrCommonCard(message)
        this.render().catch((err) => {console.log("Error rendering dialog", err)})
        this.dialog_element.showModal()
    }

    async render() {
        this.dialog_element.innerHTML = await renderTemplate(
            'modules/betterrolls-swade2/templates/card_dialog.html', {BrCard: this.BrCard});
        for (let button of document.querySelectorAll('#br-card-dialog .brsw-cancel')) {
            button.addEventListener('click', this.close_card.bind(this))
        }
        console.log(this.BrCard)
    }

    close_card() {
        this.BrCard = null
        this.dialog_element.inner_html = ''
        this.dialog_element.close()
    }
}