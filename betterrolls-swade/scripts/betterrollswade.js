class CustomRoll {
	/**
	 * The base function fot custom roll.s
	 */
	constructor(item) {
		this.actor = item.actor;
		this.item = item
	}

	get_skill(){
		/* Returns the ability used for this item */
		let ability = "Fighting"  // Default
		if (parseInt(this.item.data.data.range) > 0) {
			// noinspection JSUnresolvedVariable
			if (this.item.data.data.damage.includes('str')) {
				ability = "Athletics"
			} else {
				ability = "Shooting"
			}
		}
		return ability
	}

	add_modifiers(roll_string, modifier){
		// Add a modifier to a roll string
		if (modifier > 0) {
			roll_string = roll_string + "+" + modifier;
		} else if (modifier <0) {
			roll_string = roll_string + "-" + Math.abs(modifier);
		}
		return roll_string;
	}

	async toMessage(){
		// Attack roll
		let parts = [];
		let skill = this.get_skill();
		let die = "4"
		let skill_modifier = "-2"
		let wild_die = "6"
		let rof = this.item.data.data.rof
		let currentRoll
		let roll_string = ''
		let attack_array = []
		if (isNaN(rof) || rof < 1) {
			rof = 1
		}
		this.item.options.actor.data.items.forEach((item) => {
			if (item.name === skill) {
				die = item.data.die.sides;
				skill_modifier = parseInt(item.data.die.modifier);
				wild_die = item.data['wild-die'].sides;
			}
		})
		for (let i=0; i < rof; i++) {attack_array.push(`1d${die}x=`)}
		if (this.item.options.actor.data.data.wildcard) {
			attack_array.push(`1d${wild_die}x=`);
		}
		let attack_rolls = [];
		let minimum_roll = 999999;
		let discarded_index = 999999;
		let nice_string = ""
		let nice_results = []
		attack_array.forEach((dice_string, index) => {
			roll_string = dice_string
			roll_string = this.add_modifiers(roll_string, skill_modifier)
			// Wounds and fatigue
			roll_string = this.add_modifiers(
				roll_string, this.item.options.actor.calcWoundFatigePenalties())
			roll_string = this.add_modifiers(
				roll_string, this.item.options.actor.calcStatusPenalties())
			currentRoll = new Roll(roll_string);
			currentRoll.roll()
			currentRoll.dice.forEach((dice) => {
				dice.rolls.forEach((roll) => {
					nice_string = nice_string + `d${dice.faces}+`;
					nice_results.push(roll.roll);
				})
			})
			// Dice so nice, roll all attack dice together
			attack_rolls.push(currentRoll)
			if (currentRoll.total < minimum_roll) {
				minimum_roll = currentRoll.total
				discarded_index = index
			}
		})
		if (game.dice3d) {
			// noinspection ES6MissingAwait
			game.dice3d.show({formula: nice_string.slice(0, -1),
								 results: nice_results})
		}
		attack_rolls[discarded_index].discarded = true
		let array_show = attack_rolls.slice()
		if (array_show.length > 1) {
			array_show.splice(discarded_index, 1)
		}
		let attack_roll = {roll_title: 'Attack', rolls: attack_rolls,
			rolls_accepted: array_show};
		parts.push(attack_roll);
		// Damage roll
		let damage_rolls = []
		for (let i = 0; i < rof; i++){
			let damage = new Roll(makeExplotable(this.item.data.data.damage),
								  this.item.actor.getRollShortcuts());
			damage.roll();
			if (game.dice3d) {
				// noinspection ES6MissingAwait
				game.dice3d.showForRoll(damage)
			}
			damage_rolls.push(damage)
		}
		let damage_roll = {roll_title: 'Damage', rolls: damage_rolls,
			rolls_accepted: damage_rolls};
		parts.push(damage_roll);
		// Raise damage
		let raise_damage_rolls = []
		damage_rolls.forEach((damage) => {
			let raise_damage_roll = new Roll(`${damage.total}+1d6x=`);
			raise_damage_roll.roll()
			if (game.dice3d) {
				game.dice3d.showForRoll(raise_damage_roll)
			}
			raise_damage_rolls.push(raise_damage_roll)
		})
		let raise_damage = {roll_title: 'Raise damage',
							rolls: raise_damage_rolls,
							rolls_accepted: raise_damage_rolls};
		parts.push(raise_damage);
		let bennies_available = true;
		if (this.actor.isPC) {
			if (this.actor.data.data.bennies.value < 1) {
				bennies_available = false
			}
		}
		let content = await renderTemplate(
			"modules/betterrolls-swade/templates/fullroll.html", {
				parts: parts, title: this.item.name,
				description: this.item.data.data.notes ||
					this.item.data.data.description,
				item_id: this.item.id,
				actor_id: this.actor.id,
				bennies_available: bennies_available
			});
		let chatData = {
			user: game.user._id,
			content: content,
			speaker: {
				actor: this.actor._idx,
				token: this.actor.token,
				alias: this.actor.name
			}
		}
		/* TODO whisper settings */
		await ChatMessage.create(chatData);
	}
}

function makeExplotable(expresion) {
	// Make all dice of a roll able to explode
	// Code from the SWADE system
	const reg_exp = /\d*d\d+[^kdrxc]/g;
	expresion = expresion + ' '; // Just because of my poor reg_exp foo
	let dice_strings = expresion.match(reg_exp);
	let used = [];
	dice_strings.forEach((match) => {
		if (used.indexOf(match) === -1) {
			expresion = expresion.replace(new RegExp(match.slice(0, -1), 'g'),
				match.slice(0, -1) + "x=");
			used.push(match);
		}
	})
	return expresion;
}

function spendMastersBenny() {
	// Expends one bennie from the master stack
	game.users.forEach((user) => {
        if (user.isGM) {
            let value = user.getFlag('swade', 'bennies');
            // noinspection JSIgnoredPromiseFromCall
			user.setFlag('swade', 'bennies', value - 1);
        }
	})
}

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
