import {brCard} from "./brcard.js";
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
			let card = new brCard(item);
			await card.toMessage();
		});
	}
	let skill_list;
	if (actor.data.type === "character") {
		skill_list = html.find('li.item.skill');
	} else {
		if (game.settings.get('betterrolls-swade', 'rollNPCSkills')) {
			skill_list = html.find('span.item.skill');
		} else {
			skill_list = [];  // No skill for NPC if setting disabled.
		}
	}
	for (let skill_element of skill_list) {
		let skill_wrapper = $(skill_element);
		if (actor.data.type === 'npc') {
			// Remove the block-inline style so the skills are shown one per
			// line.
			skill_wrapper.removeAttr("style");
			skill_wrapper.attr('style', 'display:flex;')
		}
		let item_id = String(skill_wrapper.attr('data-item-id'));
		let skill = actor.getOwnedItem(item_id);
		skill_wrapper.prepend(`<img alt="roll" class="brsw-skill-image" src="${skill.img}" data-item-id="${item_id}">`);
		let div_skill = skill_wrapper.find(".brsw-skill-image");
		div_skill.click(async event => {
			event.preventDefault();
			event.stopPropagation();
			let item = actor.getOwnedItem(String($(event.currentTarget).attr("data-item-id")));
			let roll = new brCard(item, 'skill');
			await roll.toMessage();
		})
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
	game.settings.register('betterrolls-swade', 'rollNPCSkills', {
		name: "Roll NPC skills",
		hint: "Add an image to the NPC sheet to be able to roll their skills",
		default: false,
		scope: "world",
		type: Boolean,
		config: true
	});
	game.settings.register('betterrolls-swade', 'resultRow', {
		name: "Show result row",
		hint: "Show a row below the result with a small success/raise calculator",
		default: true,
		scope: "world",
		type: Boolean,
		config: true
	});
}

function calculate_result(id_roll, html) {
	if (! html) {
		html = $('.result-roll');
	}
	let roll_result = parseInt(html.find('#roll_result' + id_roll).val());
	let modifier = parseInt(html.find('#modifier' + id_roll).val());
	let target = parseInt(html.find('#difficulty' + id_roll).val());
	let output_row = html.find('#result' + id_roll);
	let result = (roll_result + modifier - target) / 4;
	if (result < 0) {
		output_row.text('Failure');
	} else if (result < 1) {
		output_row.text('Success');
	} else {
		let raises = Math.floor(result);
		output_row.text(`${raises > 1 ? raises:''} Raise${raises > 1 ? 's':''}!`)
	}
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
		let actor = game.actors.get(String(widget.attr('data-actor-id')));
		let item = actor.getOwnedItem(String(widget.attr("data-item-id")));
		let card_type = String(widget.attr("data-card-type"));
		let extra_notes = String(widget.attr('data-extra-notes') || '') ;
		if (widget.hasClass('cost-benny')) {
			if (actor.isPC) {
				await actor.spendBenny();
			} else if (actor.data.data.wildcard && actor.data.data.bennies.value > 0) {
				await actor.spendBenny();
			} else {
				spendMastersBenny();
			}
		}
		let roll = new brCard(item, card_type);
		await roll.toMessage(extra_notes);
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
	let result_roll = html.find('.result-roll');
	if (result_roll.children('.br-modifier-box').length > 0) {
		// Avoid calculating fumbles
		let id_result = result_roll.attr('data-id-result');
		calculate_result(id_result, html);
		let modifier = html.find('#modifier' + id_result);
		let target = html.find('#difficulty' + id_result);
		modifier.change(() => {calculate_result(id_result)});
		target.change(() => {calculate_result(id_result)});
	}
})
