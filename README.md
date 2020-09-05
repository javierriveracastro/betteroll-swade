# Better rolls for SWADE
A module modifying FoundryVTT Savage Worlds character sheets ripping ideas (and code) from the Better rolls for 5e module.

## Skill Rolls

The module will show an image before the skill name. 

![Skills](docs/doc_skills.png)

When you click on it, it will roll that skill directly with the following format

![Skill roll](docs/skill_roll.png)

The result includes wounds and state penalties
The wild die is always the last one and it's marked with a shadow of the dice size. Used rolls will be black, discarded ones will be light grey.
You can clink on the result to get more information (explosion, dice faces, modifiers)

Clicking in the "Rerroll spending a Benny button" will repeat the roll, removing a Benny from the character. If the roll was made by a game master and the character has no bennies it will subtracted from gm bennies.

The systems always roll a wild die for extras but it will never get selected (it will always show as gray). It is used to detect fumbles and can also be used for group rolls.

Red numbers means that a fumble has been rolled, explosions are marked in blue.

## Skill Rolls (npc sheets)

You can now turn skill rolls for NPCs in the options.

![NPC_skill_setting](docs/settings_npc_skills.png)

When enabled the default npc sheet will be modified to add small images before the skills. Clicking on then will make the roll.

## Roll results

If you enable it on settings you should be able to see a result roll. It is enabled everywhere but from multirof attacks

![Settings for result row](docs/settings_show_result.png)

This looks like this

![Result row for skills](docs/skill_result_row.png)

The first input box is the modifier to the roll, the second one the target (difficulty) number. If you modify any of then a new result will be calculated.
Note that modifying this values is local to your computer, other people can't see it.

## Weapon Rolls

Weapon rolls can be toggled from the weapon image either in the inventory or quick access.
By default it will roll every possible dice: attack, damage and raise damage.

![Weapon roll](docs/weapon_roll.png)

This can be disabled in settings. (From version 1.0.6 this is now a world setting)

![Settings](/docs/settings.png)

The simple roll looks like that:

![Simple weapon roll](docs/simple_weapon_roll.png)

You can then use the buttons to re-roll the attack or roll damage.

![Weapon damage roll](docs/weapon_damage_roll.png)

You can use the ROF field of the weapon to force multiple attacks, including using edges like frenzy.

![Weapon ROF 3 roll](docs/weapon_rof_3_roll.png)

The system will assume any weapon with no or 0 range uses fighting.
Weapons with range will use shooting unless @str is used in damage field, then it will use athletics.

## Power rolls

They work mainly like the others. You need to click on the image to roll the power.

![Power roll](docs/power_roll.png)

If the power has a damage field it will roll or ask to roll damage depending on settings.

The system will look for all arcane skills on the sheet and roll the last one. You can force the use of any skill by putting its name on the Arcana field of the power. Beware of translations 

## Character sheet

To be able to use right click context menus, the modules needs to make some changes to the default sheet.

The most noticeable one is the removal of all the internal scroll areas and making the full sheet scrollable

![Smaller sheet](docs/small_sheet.png)

As a result the sheet now can be shrinked and works better on smaller screens.

## Other features.
- Skill names will be recognised in English, German or Spanish. You can use any language for an arcane skill as long as it's on the arcane field of a power.
- Hellfrost skills supported (only in English or German)
- Support for Dice so Nice

## Acknowledgements
- Atropos for making Foundry VTT
- RedReign for Better Rolls 5e
- FloRad for making the SWADE system for Foundry
- All the nice people in the #swade channel of the official discord. Such a great community,

## License
The source code is licensed under GPL-3.0.
