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
				let roll = new CustomRoll(item)
				if (item.type === "weapon"){
					await roll.toMessage()
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
	let reroll_button = html.find('.btn-reroll');
	reroll_button.click(async (event) => {
		event.preventDefault();
		event.stopPropagation();
		let actor = game.actors.get(String(reroll_button.attr('data-actor-id')));
		let item = actor.getOwnedItem(reroll_button.attr("data-item-id"));
		if (actor.isPC) {
			await actor.spendBenny();
		} else if (actor.data.data.wildcard && actor.data.data.bennies.value > 0) {
			await actor.spendBenny();
		} else {
			spendMastersBenny();
		}
		let roll = new CustomRoll(item);
		await roll.toMessage();
	})
})


// TODO: Separate attack/skill and damage rolls into different methods
// TODO: if this configuration is enabled show only the attack roll
// TODO: Show a button to roll damage
// TODO: Roll damage
