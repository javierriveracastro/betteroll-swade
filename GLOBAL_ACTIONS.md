# Better Rolls 2 for SWADE: Global actions documentation.

Global actions are a json encoded set of instructions that allow the user to customize how Better Rolls work.

## Example Action

```
{"id":"LEG","name":"Called Shot: Leg","button_name":"Leg Remover",
"skillMod":-4,"dmgMod":4,"dmgOverride":"","selector_type":"item_type","selector_value":"weapon"}
```

This piece of json will add an action called "Leg Remover" to every weapon card.
If this action is checked it will add a penalty of 4 to the skill roll and a bonus of 4 to the damage roll.

## Needed fields:

* id: Any string, needs to be different for each action.
* name: The name of the action.
* button_name: The name that will be displayed on the icon. Will be made optional in some update.

## Optional fields:

* skillMod: A number to be used as a modifier to the related skill roll.
* dmgMod: A number that will be used as a modifier for a damage roll
* dmgOverride: A foundry die expression that will be rolled for damage instead of the weapon default.
* defaultChecked: If this key exist the action button will start pinned (marked in red)
* runSkillMacro: This key will run a macro named like its value after skill roll.
* runDamageMacro: This key will run a macro named like its value after damage roll.

## Selector fields:

This group of fields are used to select when the action is available, you will need to specify a selector_type and a selector_value for a simple selection. You can also use and_selector and give it a list of simple selectors.

### selector_type:
* skill: selector_value must be a string. The action will be available when the item uses a skill with that name
* item_type: selector_value must be another string, a valid SWADE item type: weapon, power, edge, ...
* actor_name: selector_value must be a string. The action will be available to actor that include that string in their name.

### complex_selectors:
* and_selector: Takes a list of the above selectors and executes the action if all are true i.e: 'and_selector'. As an example the following json will select and item that uses fighting skill and is owned by an actor whose name includes Jhon.

```  
and_selector: [{'selector_type': 'skill', 'selector_value':'figthing}, {'selector_type':'actor', 'selector_value': 'Jhon'}] 
```

## Macros:
The following variables are pre-populated in a macro run from global actions for macro writer convenience.
Note that all info is already stored in the message, all the other are just conveniences.

```
const actor = actor_param; // The card actor
const item = item_param; // The card item
const speaker = ChatMessage.getSpeaker();
const token = canvas.tokens.get(speaker.token);
const character = game.user.character;
const message = message_param; // The full message objetc
```
