# Changelog

## Version 2.26, The late one
* Lots of translation and spelling fixes
* Remove "more options" from cards
* Use parry as difficult to hit adjacent targets with ranged attacks
* Autoapply distance penalties for ranged attacks
* Respect DSN configuration about showing the result after or before rolling
* Joker now modify damage
* Various sheet fixes
* Better handling of soak rolls.

## Versio 2.25, World global actions aka What?
* Added a settings window to create and manage global actions tied to a world.
* Yet another attempt at having a sane chat scroll
* Shorter cards.

## Version 2.24, Did I broke Official Sheet?
* BUGFIX: Skill couldn't be rolled from the Official Sheet.
* Actions are now  collapsed on direct rolls.
* There is a window that do nothing in settings from World Global Actions.

## Version 2.23 aka Click Hijacking
* Add a setting window for optional rules
* Support Gritty Damage as an optional rule.
* Actions in the chat card are now collapsable
* Translations updates.
* Auto-scroll to see the end of a modified chat card is now more aggresive
* Apply damage icon changed
* On the character sheet, on quick access, clicking the item name now shows a better rolls card, please use modifiers to see the default behaviour


## Version 2.22 aka les enfants de la Foundry
* Added the "Voidomancy" arcane Skill from the Sundered Skies Companion (english only). (SalieriC)
* BUGFIX: Skills and other items of the same name should no longer cause BR to pick the wrong item to roll a Trait from.(SalieriC)
* Infrastructure work to allow personal global actions
* BUGFIX: The module didn't roll when multiple actions where selected.
* Initial support for Manifest+
* Updated translations for all the supported languages
* Added French to supported languages.
* BUGFIX: Chat is forced to scroll when the last card is modified.
* Better handling of the incapacitation test.
* Added active effects for the remaining injuries
* BUGFIX: Use parry modifier when available to calculate TN.

## Version 2.21 aka Injuries!!!!
* BUGFIX: Betterrolls shouldn't break when in combat an with no card deal
* Updated Spanish translations
* Injury card and rolls.
* Injury that decreases an atribute applied as active effects.
* Edit Edges, Hindrances and abilities in the NPC sheet with right click (consistent with skills)
* Show Edges, Hindrances and abilities in the NPC with left clicks
* Power rolls when failed, and expend PP is activated, deduct just 1 point.

## Version 2.2 aka Scared of 0.8
* BUGFIS: Some debug info was shown in char card.
* Incapacitation card.
* Global actions can be enabled/disabled on settings
* Global actions for "The Drop" and "Called Shot:Head"
* Global actions can now be selected by item type.
* Actor and token names are used with more consistence.

## Version 2.1 aka Google Übersetzer sagen, dies sollte deutsch sein
* German translations (Razortide)
* Updated documentation (Razortide)
* Show a message when pp overflows (SalieriC)
* Better management of pinned (marked in red) actions.
* New button to repeat a card
* Old rolls are a 30% bigger.
* Soak text and translations updated (Javier Rivera/Razortide)
* BUGFIX: A soak roll of 4 now removes a wound
* Actions now show an icon before than an have bigger margins.

## Version 2.0 aka Release...
* BUGFIX: Damage was not beign rolled when in full automation.
* BUGFIX: Actions marked in red now are keeped after rolling.
* Hardy is now supported.
* BUGFIX: Message update is forced to avoid some corner problems. 
* Global actions can now set status on user.
* As a result Wild Attack now makes the user vulnerable
* Better documentation, big thanks to Razortide.

## Version 1.119 Did I already used bugfixing?
* Multiple bugs in soak rolls. Logic got rewritten so lots of bugs solved, some new ones likely introduced.
* Don't spend bennies for FREE soak rerolls
* Show the apply damage option for exact shaken results.

## Version 1.118 aka Something global is born.
* Show an (*) after Roll: when modifiers are active
* Start of the "Global action" implementation.
* "Wild Attack" global action should appear on figthing items, it should give +2 to attack and damage
* Follow setting options about ammo and pp management in direct rolls

# Version 1.117 aka Bugfixing
* BUGFIX: Extras can now soak
* BUGFIX: The module doesn't break when Dice So Nice is not installed
* When in combat, mark defeated tokens after damaga
* Added an option to disable auto power-point managemet.

# Version 1.116 aka Moving settins
* Support for Dice So Nice and SWADE 0.16.2
* Hitting return in the ammo or power points management menu should reload foundry.

# Version 1.115 aka Not at all playing catch up with Swade Tools
* Soak rolls
* Characters in combat that have been giving a Joker gets a +2 bonus

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