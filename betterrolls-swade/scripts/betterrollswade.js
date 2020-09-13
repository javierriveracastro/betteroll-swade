import {brCard} from "./brcard.js";
import {spendMastersBenny} from "./utils.js";

async function bind_click(target, actor, rof) {
	// Function binded to click events that can cause a card to be created
	if (target.target) {
		// Target is an event
		target.preventDefault();
		target.stopPropagation();
		target = target.currentTarget;
	}
	target = $(target);
	if (! target.attr('data-item-id')) {
		// We are likely inside a li who contains the item id
		target = $(target).parents(".item");
	}
	let item = actor.getOwnedItem(String(target.attr("data-item-id")));
	let card = new brCard(item, '', rof);
	await card.toMessage();
}

function changeRolls (actor, html) {
	if (actor && actor.permission < 3) { return; }
	// Remove all scrollables and inline actor styles
	html.find('.scrollable').removeClass('scrollable');
	html.find('.quickaccess-list, .inventory, .power-list, .skills-list, .gear-list, .gear.skills').css(
		'overflow', 'visible');
	// Images and events in items with image
	let itemImage = html.find('.item-image');
	if (itemImage.length > 0) {
		itemImage.off();
		itemImage.click(event => {// noinspection JSIgnoredPromiseFromCall
			bind_click(event, actor)});
	}
	// Images and events in skill list
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
			skill_wrapper.attr('style', 'display:flex;');
		}
		let item_id = String(skill_wrapper.attr('data-item-id'));
		let skill = actor.getOwnedItem(item_id);
		skill_wrapper.prepend(`<img alt="roll" class="brsw-skill-image" src="${skill.img}" data-item-id="${item_id}">`);
		let div_skill = skill_wrapper.find(".brsw-skill-image");
		div_skill.click(event => {// noinspection JSIgnoredPromiseFromCall
			bind_click(event, actor)})
	}
	// Create the context menu
	let menu_items = [{icon: '<i class="fas fa-dice-d6"></i>', name:"Roll 1 dice",
					  callback: (t) => {// noinspection JSIgnoredPromiseFromCall
							bind_click(t, actor, 1)}},
				  {icon: '<i class="fas fa-dice-d6"></i>', name:"Roll 2 dice",
					  callback: (t) => {// noinspection JSIgnoredPromiseFromCall
							bind_click(t, actor, 2)}},
				  {icon: '<i class="fas fa-dice-d6"></i>', name:"Roll 3 dice",
					  callback: (t) => {// noinspection JSIgnoredPromiseFromCall
							bind_click(t, actor, 3)}},
				  {icon: '<i class="fas fa-dice-d6"></i>', name:"Roll 4 dice",
					  callback: (t) => {// noinspection JSIgnoredPromiseFromCall
							bind_click(t, actor, 4)}}]
	new ContextMenu(html.find('.item.skill, .item-image'), null, menu_items);
}

function register_settings() {
	game.settings.register('betterrolls-swade', 'dontRollDamage', {
		name: "Don't autoroll damage",
		hint: "Shows a button for damage rolling instead of rolling it automatically with the attack",
		default: false,
		scope: "world",
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
		name: "Expand the result row",
		hint: "Roll result will be expanded by default",
		default: true,
		scope: "world",
		type: Boolean,
		config: true
	});
}

function calculate_result(id_roll, html) {
	if (! html) {
		html = $('.brsw-result-roll');
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
		let force_rof = null;
		if (widget.attr('data-rof')) force_rof = String(widget.attr('data-rof'));
		if (widget.hasClass('cost-benny')) {
			if (actor.isPC) {
				await actor.spendBenny();
			} else if (actor.data.data.wildcard && actor.data.data.bennies.value > 0) {
				await actor.spendBenny();
			} else {
				spendMastersBenny();
			}
		}
		let roll = new brCard(item, card_type, force_rof);
		await roll.toMessage(extra_notes);
	});
	let collapse_button = html.find('.collapse-button');
	collapse_button.click(e => {
		e.preventDefault();
		e.stopPropagation();
		let clicked = $(e.currentTarget)
		let description_span = html.find('.' + clicked.attr('data-collapse'));
		description_span.toggleClass('description-collapsed');
		if (description_span.hasClass('description-collapsed')) {
			clicked.find('.fas').removeClass('fa-caret-down');
			clicked.find('.fas').addClass('fa-caret-right');
		} else {
			clicked.find('.fas').addClass('fa-caret-down');
			clicked.find('.fas').removeClass('fa-caret-right');
		}
	})
	const result_rows = html.find('.brsw-result-roll');
	if (result_rows.length > 0) {
		// Avoid calculating fumbles
		result_rows.each((i, div) => {
			let id_result = $(div).attr('data-id-result');
			calculate_result(id_result, html);
			['modifier', 'difficulty', 'roll_result'].forEach(name => {
				let input = html.find('#' + name + id_result);
				input.change(() => {calculate_result(id_result)});
			})
		})
	}
})
