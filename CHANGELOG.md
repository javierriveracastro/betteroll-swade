# Changelog

# 1.2.0 aka Time to upgrade everything
* This version is compatible and requires FoundryVTT version 0.7.4
* This version need DiceSoNice version 3 for 3D dice. It won't work with DSN 2. Install with https://gitlab.com/riccisi/foundryvtt-dice-so-nice/raw/alpha/module/module.json
* Fixed a bug where it finds no skill when there is no untrained skill
* Initial support for item actions: Skill action modifiers are now supported. You need to use a complex roll to access actions.
* Initial support for macros. brCard is exposed and can be used in macros, see the documentation for more information.
* If DiceTray is installed, Betterrolls will use its modifier box.
* Fixed a bug with ones (and critical failures) detection in Foundry 0.7 series
* The result now is now show for damage rolls. It's still very basic.
* Much better handling of damage modifiers. Damage modifiers avaliable in complex rolls.
* Damage buttons that appear when rolling weapons or powers with damage autoroll disable now roll for damage once independent of weapon rof value.

# 1.1.3 aka Nothing to see here (well maybe even more bugs)
* A bugfix to make fighting difficulty from parry work when the skill was set in "Actions and Effects" tab.

# 1.1.2 aka bugssss
* Solve a bug when rolling damage
* Now if you use a fighting skill and some token is targeted, difficulty will default to that token parry

# 1.1.1 aka Catching on 0.12.1
* Limit the maximum trait dice to 20
* Started release automation
* Refactoring to make it easier to control complex rolls and rerolls
* Display the related skill description of weapons and powers in the chat card
* Allow custom Target Numbers on complex tolls
* Some bugfixes
* And finally support for skills and modifiers in the "Actions and Effects" tab. Still no support for actions.

# 1.1.0 aka Complex rolls
* The main feature is the complex roll window, it allows you to specify any amount of trait dice (up to 30) and add a modifier to the roll. This is also the reason for the big version bump.
* Mark in red the rolls with a natural one on the dice even when their not critical failures

# 1.0.9 aka plenty of bugfixes

* This is a bugfix release, no new features
* Damage expression without any dice work
* CSS prefixes added everywhere to avoid collisions
* The result row now recalculates result on dice change.
* Removed the code to change sheet height, it was too buggy.

# 1.0.8

* Reworked result row ui. Now it's always calculated but can be collapsed by default
* Added french skill names
* Solve a couple of context menu bugs.

# 1.0.7

* Show the result of the roll in the result-roll
* Throw multiple trait dice using right click menu
* SHow the result-row on multiple trait / high rof rolls

# 1.0.6

* 3d dice are now shown to every player.
* The default character sheet has been modifyed to make context menus possible
* The full sheet is now scrollable, as a result it can shrink
* In resolutions below 1000 pixels of height, character sheet heigh now defauts to 70% of avaliable space
* Raise damage, when rolling it toghether with normal damage is now 1d6 plus normal damage
* Autorrol damage is now a world setting (set by the master) not a client one (set by each player)

# 1.0.5

* Solved a nasty bug: it was checking all the page when hooking the description collapse button. Could had a nasty result for performance when the chat log was big.
* Correct grammar and plural in raises.
* Result roll is now active in powers and ROF 1 (single) attacks.
* More refactoring that should result in faster, easier to read code.

# 1.0.4

* Big refactoring. Breaking the main roll class in two to get simpler code.
* Discarded dice are grey even when exploded and marked with a red line.
* Clickable icons now change the cursor shape and show a shadow when hovering over them.
* CSS fixes for the skill list. I hope that they look better both in character and npc sheets.
* BUGFIX: Always get a skill for an attack roll even when there are edges with the same name.
* BUGFIX: Use Critical Failure instead of Fumble as it is the official wording.

# 1.0.3

* Bugfix in Hellfrost skill list
* Result calculation for skill rolls
* Support for custom arcane skills

# 1.0.2

* Initial documentation
* First try to NPC skill rolls (optional)
* Item image on roll cards
* Bigger font in descriptions

# 1.0.1

* Bugfixes for non svg skill images
* Bugfix for images in multiline skill names
* Support for skill names in Spanish
* Some support for Hellfrost magic skills

# 1.0.0

* This is now feature complete.
* Skill images in character sheet and skill rolls

# 0.1.5

* Show when a roll is the result of spending a Benny.
* Add a footer to the card with generic weapon or power information
* See Armor Penetration in the damage total
* Always show all dice, including discarded ones.
* Roll an extra d6 for extra (it's always discarded) for fumble an special results checking
* Mark the wild die with a dice background
* Use red text for fumbles and blue for explosions in trait checks

## 0.1.4

* Fixed ROF 0 bug
* Raise damage now is rolled just once when "don't autoroll damage is activated"
* CSS fixes, and I hope better looking cards
* Description is now collapsable
* Support for rolling powers 

## 0.1.3

* Attack and damage can now be rolled together or separate.

## 0.1.2

* Make the roll respect whisper settings.
* Works with SWADE 0.10.1

## 0.1.1

* Fix a bug that prevented damage dice from exploding.
