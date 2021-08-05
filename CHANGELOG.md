# Changelog

## Version 2.41 aka killing lots of lovely animals.
* Bug: Macros now run on skill actions.
* Bug: Removed old uses os skill_from_string that makes arcane skills fail to roll
* Bug: Initial support for arcane devices (SalieriC)
* Bug: Pitch dark modifier was -2 instead of the correct -6
* Bug: Attacks from tokens with the same disposition now don't calculate gangup
* Bug: Defeated enemies are not counted for gangup
* Bug: Gangup was not fired when action changed the skill to fighting, nor suppressed when it was change away from figthing
* Bug: Soaking was miscalculating bonuses for characters that ignore wound penalties
* Bug: Items in inventory where not draggable to macro bar
* Bug: Armor localizations in the footer of the item card are not space separated and translated

## Version 2.40 aka skills are no less than items
* Refactoring: Template has been moved to render_data from a flag.
* Refactoring: Now chat messages updates are forced in a less destructive way and this should prevent some issues.
* UI: Right click now always opens an item to edit.
* Skills: Skill cards now support actions.
* Bug: Direct rolling now shows against all actions collapsed

## Version 2.39 aka rushed bugfixing, let's sacrifice a goat to Shane and hope for the best
* Bug: Ilumination translation strings where mixed between Spanish and English.
* Bug: Don't try to scroll the chatbar on the initial rendering.
* Bug: Try to avoid racing with system to set bennie image.
* Foundry citizenship: Use a local CSS rule instead of foundry one to set button with image
* Translations: Another bunch of updates from the weblate team.
* Global actions: Added frenzy to module actios.
* Documentation: Lots of updates and reorganization (Bruno Calado)


## Version 2.38 aka let's try to organize changelogs, maybe someone will read them.

* Cards: Description added to skill cards
* Cards: Added a setting to expand roll results by default (holgaph)
* Internal refactoring: skill_id and attribute_id moved to render_data
* Global actions: Support of or_selector, support for ROF action, added actor_has_hindrande selector, added all selector
* Global actions: Illumination actions added to system actions.
* Bugs: Items card without rolls where not show (reicargaywood)
* Bugs: Joker detection was not working
* Rolls: Added support for gangup (brunocalado)
* Translations: Added a custom string for AP (Armor Penetration abbreviated)
* Translations: Usual bunch of updates from the weblate team


## Version 2.37 aka groups done at last.

* Use heigh in distance calculations
* Remove some warnings.
* Macros are now run after the message is updated so they get the latest data.
* Item actions are now grouped in the chat card.
* There is now a setting to hide the weapon actions, so only global actions are shown.
* The usual couple of translations updates (Weblate team).
* Scale modifiers support (Bruno Calado)
* Better internal way of storing skills in cards.

## Version 2.36 aka enjoying the other side.

* Documentation has been revamped, not really a great improvement, but hopefully it will create the infrastructure for it.
* System global actions are shown by group in settings and can be enabled and disabled by group
* Fix non-wilcard hig-rof reroll (zk-sn)
* Accept die trems modifiers for damage rolls
* Improved docs (Bruno Calado)
* Damage rolls details show the dice rolled instead of the full formula
* Cover modifiers added to system global actions
* Clicking the die in the official sheet now shows the br card
* Clicking buttons on power cards now show the br card
* Torg style token bars added (torg team)
* Lots of updates translations (David Montilla, Cyril Ronseaux and others in the weblate team)
* usedShots field added to global actions.
* Fix mark/unmark defeated in 0.8.x (zk-sn)

# Version 2.35 aka Stabilization between sides.

* Added groups to global actions.
* Add settings extender as a dependency.
* Attributes can now be used for an item trait roll
* Added languages strings, and again generally better translations.
* Parry now works in italian (zk-sn)
* Trait modifiers now allow for die formulas in addition to single numbers (i.e. "+1d4x")
* Macros now use mod keys to set the default behaviour (zk-sn)
* Option to select how multi-rof weapons work, single shot or maximum ROF (zk-sn)
* Weblate team updates for Spanish, Italian and German translations
* Custom modifiers names are now correctly shown.

# Version 2.34 aka At the other side

Thanks to all people who helped test the 0.8 and 0.7 compatibility

* Updates to enable 0.8.6 compatibility
* Better shot calculation
* Documentation updates (Bruno Calado)
* Solved a bug when drag and dropping attacks that causes the shot deduction logic to happen for melee weapons
* The usual couple of translation from the weblate team.

# Version 2.31 aka Before the 0.8 apocalipsys
* Lots of typos everywhere (zk-sn, Cyrul ROnseaux, Bruno Calado)
* Lots of translation updates (Weblate teams)
* Fix for Str 1. (zk-sn)
* Change the skill name in the card when an action makes it roll one different from the default one
* Remove duplication of skill name in the card.
* used_shots are now passed to macros
* Direct roll respect now the default_checked global action

## Version 2.30 aka At least something useful from all that global actions
* Updated German and Spanish translations
* Add an option to show the results details expanded by default
* If you have multiple tokens targeted Better Rolls will now roll damage once for each.
* Global actions get a formula to: change or remove the wild die, add a modifier to a skill reroll, add a modifier to a damage reroll
* Global actions get a selector for when an actor has an edge
* Elan and No Mercy are now supported via global actions.
* Macros are now executed inside an async function as Foundry version 0.7.10 does.

## Version 2.29 Global actions going crazy
* There is now an option to hide reroll buttons on critical failures (SalieriC if you ever read this, note that I didn't say fumbles)
* Modifications to chat card metadata, hoping to make it work better with CUB
* Remove PP from the arcane backgound when possible instead of from the general pool.
* New global action selectors: actor_name_selector, item_name_selector, actor_has_effect
* Lots of typos (Razortide, SalieriC)
* The raise dice can now be changed by a global action (e.g. using a d12 instead of d6)

## Version 2.28 Global macros... or whatever
* Spanish language renamed to español
* Global actions can now be star pinned (red)
* Global actions can now execute a macro after a skill or damage roll.

## Version 2.27, Now I feel like Linus...
* Added a hook to allow other modules to run code when a button is clicked (radyrosales)
* Change the type of the chat cards to roll
* Added italian translation (zgsuppo)
* Various fixes to documentation (Cyril "Gronyon" Ronseaux)
* Updated documentation (Razortide)
* First part of portuguese support (amaurijr1976)
* Much better css styling in the cards (DanieleSuppo)
* Show an icon to make an attack deal half damage
* Accept skill in lower case for World Global Actinos (tm).

## Version 2.26, The late one
* Lots of translation and spelling fixes
* Remove "more options" from cards
* Use parry as Target Number to hit adjacent targets with ranged attacks
* Autoapply distance penalties for ranged attacks
* Respect DSN configuration about showing the result after or before rolling
* Joker now modifies damage
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
