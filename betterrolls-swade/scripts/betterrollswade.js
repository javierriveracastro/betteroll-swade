import {CustomRoll} from "./customRoll.js";
import {spendMastersBenny} from "./utils.js";

function changeRolls (actor, html) {
	/* Replaces the button in the weapons to make a new roll */
	if (actor && actor.permission < 3) { return; }
	// Assign new action to item image button
	let itemImage = html.find('.item-image');
	if (itemImage.length > 0) {
		itemImage.off();
		itemImage.click(async event => {
				event.preventDefault();
				event.stopPropagation();
				let li = $(event.currentTarget).parents(".item");
				let item = actor.getOwnedItem(String(li.attr("data-item-id")));
				let roll_type = '';
				if (item.type === "weapon"){
					roll_type = 'generate_attack_card';
				} else if (item.type === "power"){
					roll_type = 'generate_power_card';
				}
				if (roll_type !== '') {
					let roll = new CustomRoll(item);
					await roll.toMessage(roll_type);
				}
		});
	}
}

function register_settings() {
	game.settings.register('betterrolls-swade', 'dontRollDamage', {
		name: "Don't autoroll damage",
		hint: "Shows a button for damage rolling instead of rolling it automatically with the attack",
		default: false,
		scope: "client",
		type: Boolean,
		config: true
	});
}

export class BetterRollsHooks {

	static addActorSheet(sheetName) {
		let sheetString = "render" + sheetName;
		Hooks.on(sheetString, (app, html, data) => {
			changeRolls(app.object, html, data);
		});
	}
}

BetterRollsHooks.addActorSheet("SwadeCharacterSheet");
BetterRollsHooks.addActorSheet("SwadeNPCSheet");

Hooks.on(`ready`, () => {
	console.log('Better Rolls for SWADE | Ready');
	register_settings();
})

Hooks.on('renderChatMessage', (message, html) => {
	let reroll_button = html.find('.btn-roll');
	reroll_button.click(async (event) => {
		let widget = $(event.target);
		event.preventDefault();
		event.stopPropagation();
		console.log(event.target)
		console.log(widget)
		let actor = game.actors.get(String(widget.attr('data-actor-id')));
		let item = actor.getOwnedItem(String(widget.attr("data-item-id")));
		let card_type = String(widget.attr("data-card-type"))
		if (widget.hasClass('cost-benny')) {
			if (actor.isPC) {
				await actor.spendBenny();
			} else if (actor.data.data.wildcard && actor.data.data.bennies.value > 0) {
				await actor.spendBenny();
			} else {
				spendMastersBenny();
			}
		}
		let roll = new CustomRoll(item);
		await roll.toMessage(card_type);
	});
	let collapse_button = html.find('.collapse-button');
	collapse_button.click(async () => {
		let description_span = $('.text-description');
		description_span.toggleClass('description-collapsed');
		if (description_span.hasClass('description-collapsed')) {
			collapse_button.find('.fas').removeClass('fa-caret-down');
			collapse_button.find('.fas').addClass('fa-caret-right');
		} else {
			collapse_button.find('.fas').addClass('fa-caret-down');
			collapse_button.find('.fas').removeClass('fa-caret-right');
		}
	})
})
