# Changelog

# Version 1.114 aka New cards join the show.
* Damage card with ability to undo damage
* Better message data hiding logic.

# Version 1.113 aka Stealth BugSolving
* Double shaken was not working right.

## Version 1.112 aka you didn't need to reload don't you.
* Big bug: Ammo management was completely broken by yesterday update
* Various fixes to ammo management
* Option to make ammo management optional by default (you can still activate it in the card)
* Solved a bug that lose description links on card update.

## Version 1.111 aka So close to release is time to bring comments back
* Bug: Result as misscalculated in some situations
* Support for damage actions on items.
* Drag and drop support from powers outside quick acess
* Support amunition field in weapon.

## Version 1.110
* Adaptations to make it work better with SWADE 0.16
* Use of system settings for the wild die
* Remove module settings for selecting wild die theme
* Various minor refactoring.
* Remove status linking code, please use SWADE Toolkit
* Support "skill" item actions
* Solved a bug in the logic that detected when bennies where available
* Avoid duplication of the bennie animation on 0.16
* Remove deprecated SSO. translations string.

## Version 1.109
* Change the target of a damage roll
* Add a d6 to a damage roll
* Removal of lots of code
* Make macros dragged to the hotbar roll by default
* Give names and images to items dragged to the macro hotbar.

## Version 1.108
* Added translation strings for complex ammo tracking
* Hide icons so chat card is clearer.
* Let only gamemasters and card owners click on buttons
* See damage results as icons.
* Reroll damage spending a bennie
* Apply damage from the item card.

## Version 1.107
* Damage rolls incorporated into item card.
* Support for a different Dice So Nice theme for damage rolls
* Conviction dice added to damage rolls
* Bug: Solved a bug where the master was not shown the bennie reroll button while having master's bennies

## Version 1.106
* Solved a bug with macros with no token data
* Updated SalieriC ammo macro
* Initial work for damage card incorporation into item cards.

## Version 1.105
* Quite important refactoring of rolling, tns and modifiers based on targeted tokens.
* Ability to edit the modifiers after a roll
* Updated catalan translations
* Don't allow the master's bennies to go below 0.
* Ability to edit all TNs at the same time
* Better vulnerable management
* Get TNs from targeted or selected tokens.
* Spanish translations bugfixes.
* Added an option to collapse the modifier box over the chat at start.

## Version 1.104
* Bugfix: Weapon skill modifier wasn't beign added correctly.
* Modifiers can now de added and deleted.
* Integrate SalieriC power points management macro

## Version 1.103
* Bug: Use weapon rof as default.
* Bug: Use untrained skill if present and a skill that is not owned by the actor is mentioned in a weapon.
* Bug: When shots are 0 now it doesn't disscounts ammo.
* Delete damage card, move functionality to item card
* Autoroll damage as many times as attacks hit.
* Basic power point management, when rolling for powers, power pps will be deducted from actor.
* Ability to edit a roll by adding a modifier.

## Version 1.102
* Various bugdixes, including items not rolling and not rerolling.
* Added ability to see and interact with old rolls after rerolling
* Added status integration for swade-tools.

## Version 1.101
* Item cards now use the new consolidated card for trait rolls (damage is still using old one)

## Version 1.100
* Hide result roll to players when setting selected
* Catalan translation
* Skills use the new consolidated card.

## Version 1.99
* Don't activate listeners until last flag is set
* New assests for bennies: classical coins
* Attribute cards are now consolidated.

## Version 1.98
* Hopefully resolves the settings erros.

## Version 1.97
* Enable ROF 6 in chat modifiers
* Add custom bennie support (JuanV)
* Make url in module.json point the proper web page
* Bug: Armor was incorrectly defaulting to 4
* Char modifiers are now collapsable.
* More documentation work.

## Version 1.96
* Bug: Incorrect passed actor instead of token
* Bug: Don't break when there is no html and a weapon with ammo
* Move modifiers to the chat tab.
* More translations
* Incorporate ammo macro.

## Version 1.95
* Discount shots from items.
* Somewhat more current documentation
* Hide form from non-dms players, to keep cards tidy.
* Hide damage card from other players.
* Bug: Result card was not calculating results correctly in windows different as the rolling player.

## Version 1.94
* Add function to roll a skill from a macro
* Item cards and rolls
* Support for official sheet
* Add descriptions of associated skill in items
* Remove old version 1 css and compatibility.
* Reroll options moved to result card.
* Dice Tray support
* Support for skill mods in items
* Drag and drop support into hotbar
* Drag and drop support into tokens
* Use parry as difficulty for an attack roll
* Use bennie animations
* Damage cards and damage rolls
* Only show description (item or skill) section when there is one
* Rof 1 added to the card options
* Support for stars in skill names (official content)
* Use tougness of the targeted token for damage difficulty
* Reroll damage
* Armor an Armor penetration support in damage results
* Autoroll damage
* Apply damage to selected or targeted tokens.

## Version 1.93
* Solves a nasty bug that prevented editing skills.

## Version 1.92
* A couple of Spanish translations
* Saner defaults
* Some card redesign
* Button to roll spending a bennie
* First documentation
* Shadow clickable elements on hover
* Attributes draggable to macro hot bar
* Documentation attribute exposed functions
* Merge version 1.2.5 changes
* Skill cards
* Multiple trait dice rolls (high rof)
* Drag skills to macro toolbar.

## Version 1.91
* Critical failure detection
* Multilingual support.
* Spanish translation added
* Collapsable options in the card allowing discrete modifiers and target number
* Support for a different Wild Die when using Dice So Nice
* Try to fallback to actors for rolls when token is not available.

## Version 1.90
* Complete rewrite for a new, simpler version
* Attribute card, result cad, and rolling using system cards
* New basic UI
* Support for token or actor data.