import {brCard} from "./brcard.js";
import {spendMastersBenny, get_item} from "./utils.js";
import ComplexRollApp from "./rollapplication.js";

async function bind_click(target, actor, overrides={}) {
	// Function binded to click events that can cause a card to be created
	if (target.target) {
		// Target is an event
		target.preventDefault();
		target.stopPropagation();
		target = target.currentTarget;
	}
	target = $(target);
	if(event.altKey) {
		// noinspection ES6MissingAwait
		open_roll_app(target, actor)
	} else {
		let item = get_item(target, actor)
		let card = new brCard(item, '', overrides);
		await card.toMessage();
	}
}

async function open_roll_app(target, actor) {
	// Function to show the Complex Roll window
	target = $(target);
	let item = get_item(target, actor);
	let dialog = new ComplexRollApp(item,  {baseAplication: 'brswade', popOut: true});
	dialog.render(true);
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
							bind_click(t, actor, {rof: 1})}},
				  {icon: '<i class="fas fa-dice-d6"></i>', name:"Roll 2 dice",
					  callback: (t) => {// noinspection JSIgnoredPromiseFromCall
							bind_click(t, actor, {rof: 2})}},
				  {icon: '<i class="fas fa-dice-d6"></i>', name:"Roll 3 dice",
					  callback: (t) => {// noinspection JSIgnoredPromiseFromCall
							bind_click(t, actor, {rof: 3})}},
				  {icon: '<i class="fas fa-dice-d6"></i>', name:"Roll 4 dice",
					  callback: (t) => {// noinspection JSIgnoredPromiseFromCall
							bind_click(t, actor, {rof: 4})}},
				  {icon:'<i class="fas fa-pager"></i>', name:"Complex roll",
					  callback: (t) => {// noinspection JSIgnoredPromiseFromCall
						  open_roll_app(t, actor)}}];
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
	// noinspection JSFileReferences
	import('../../dice-so-nice/DiceColors.js').then(dsn => {
		let theme_choice = {};
		for (let theme in dsn.COLORSETS) {
			if (dsn.COLORSETS.hasOwnProperty(theme)) {
				theme_choice[theme] = theme;
			}
		}
		game.settings.register('betterrolls-swade', 'wildDieTheme', {
			name: 'Wild die theme',
			hint: "Choose a theme from Dice So Nice for the Wild Die",
			default: "fire",
			scope: "client",
			type: String,
			choices: theme_choice,
			config: true
		})
	}).catch(()=>{console.log('Dice So Nice not installed')});
}

function calculate_result(id_roll, html) {
	if (! html) {
		html = $('#resul-row-' + id_roll);
	} else {
		html = html.find('#resul-row-' + id_roll);
	}
	const damage = !!html.attr('data-type');
	let roll_result = parseInt(html.find('#roll_result' + id_roll).val());
	let modifier = parseInt(html.find('#modifier' + id_roll).val());
	let target = parseInt(html.find('#difficulty' + id_roll).val());
	let armor = parseInt(html.find('#armor' + id_roll).val()) | 0;
	let ap = parseInt(html.find('#ap' + id_roll).val()) | 0;
	let output_row = html.find('#result' + id_roll);
	let result = (roll_result + modifier - target);
	if (armor) {
		result = result - armor;
	}
	if (ap) {
		result = result + Math.min(ap, armor);
	}
	result = result / 4;
	if (result < 0) {
		output_row.text('Failure');
	} else if (result < 1) {
		if (damage) {
			output_row.text('Shaken');
		} else {
			output_row.text('Success');
		}
	} else {
		let raises = Math.floor(result);
		if (damage) {
			output_row.text(
				`${raises > 1 ? raises:''} Wound${raises > 1 ? 's':''}!`);
		} else {
			output_row.text(
				`${raises > 1 ? raises:''} Raise${raises > 1 ? 's':''}!`);
		}
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
		let overrides = {}
		event.preventDefault();
		event.stopPropagation();
		let actor = game.actors.get(String(widget.attr('data-actor-id')));
		let item = actor.getOwnedItem(String(widget.attr("data-item-id")));
		let card_type = String(widget.attr("data-card-type"));
		let extra_notes = String(widget.attr('data-extra-notes') || '') ;
		if (widget.attr('data-override')) overrides = JSON.parse(widget.attr('data-override'));
		if (widget.hasClass('cost-benny')) {
			if (actor.hasPlayerOwner) {
				await actor.spendBenny();
			} else if (actor.data.data.wildcard && actor.data.data.bennies.value > 0) {
				await actor.spendBenny();
			} else {
				spendMastersBenny();
			}
		}
		let roll = new brCard(item, card_type, overrides);
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
			['modifier', 'difficulty', 'roll_result', 'armor', 'ap'].forEach(name => {
				let input = html.find('#' + name + id_result);
				input.change(() => {calculate_result(id_result)});
			})
		})
	}
})
