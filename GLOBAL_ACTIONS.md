# Better Rolls 2 for SWADE: Globa actions documentation.

Global actions are a json encoded set of instructions that allow the user to customize how Better Rolls work.

## Example Action

```
{"id":"LEG","name":"Called Shot: Leg","button_name":"Leg Remover",
"skillMod":-4,"dmgMod":4,"dmgOverride":"","selector_type":"item_type","selector_value":"weapon"}
```

This piece of json will add an actions called "Leg Remover" to every weapon card.
If this action is checked it will add a penalty of 4 to the skill roll and a bonus of 4 to the damage roll.

## Needed fields:

* id: Any string, need to be different for each action.
* name: The name of the action.
* button_name: The name that will be displayed on the icon. Will be made optional in some update.

## Optional fields:

* skillMod: A number to be used as a modifier to the related skill roll.
* dmgMod: A number that will be used as a modifier for a damage roll
* dmsOverride: A foundry die expresion that will be rolled for damage instead of the weapon default.

## Selector fields:

This group of fields are used to select when the action is avaliable, you will need to specicy a selector_type and a selector_value

### selector_type:
* skill: selector_value must be a string. The action will be available when the item uses a skill with that name
* item_type: selector_value must be another string, a valid SWADE item type: weapon, power, edge, ...
    

                