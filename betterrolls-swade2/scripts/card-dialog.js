// A dialog to manage br cards
/* global game, console, renderTemplate */

export function setup_dialog() {
    let dialog_element = document.createElement('dialog')
    dialog_element.setAttribute('id', 'br-card-dialog')
    document.body.insertAdjacentElement('beforeend', dialog_element)
    game.brsw.dialog = new BrCardDialog()
}

class BrCardDialog {

    constructor() {
        this.card_id = null
    }

    get dialog_element() {
        return document.getElementById('br-card-dialog')
    }

    show_card(card_id) {
        if (this.card_id !== card_id) {
            this.card_id = card_id
            this.render().catch(err => {
                console.error("Error rendering the dialog",err)
            })
        }
        this.dialog_element.showModal()
    }

    async render() {
        this.dialog_element.innerHTML = await renderTemplate(
            'modules/betterrolls-swade2/templates/card_dialog.html', {id: this.card_id});
    }
}