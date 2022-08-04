# Better Rolls for SWADE

This module adds a complete different rolls cards to the SWADE system that supports both more complex rolls and more automation.

* This is more complex than system default rolls. It's quite likely that you don't need it. Please try SWADE without it first and only check it out if you feel rolls could be improved.
* You need to be familiar with the rules of Savage Worlds to use it. You need to know e.g. which dice are discarded and how damage is affected by raises; generally speaking, this is not a good module for beginners. It could be confusing. So, again, please use the base system and get familiar with it before using this module.

Please leave your feedback on the official Foundry discord. Feel free to ping me if you want.

Criticism, feature requests, and UI changes are all welcome but, if you want me to do something about it, please be as detailed as you can. Please, at the very least, tell me what you expect and why do you believe your approach is better.

# Features

* Complex roll cards supporting modifiers, target numbers from target tokens, actions, etc...
* Apply damage and injuries
* Multiple targets for damage
* Multiple languages
* Edge automations.
* Gritty damage automation
* Flexible way to add new actions to items
* Support for 0.7.10 and 0.8.x Foundry versions (support for 0.7.10 will be removed)

# Documentation

In the [Wiki for this repository](https://github.com/javierriveracastro/betteroll-swade/wiki) you will find a detailed documentation concerning the critical elements and functionality of Better Rolls fo SWADE. If you find outdated or missing information please feel free to create an issue to inform me about it.

HTML version: https://javierriveracastro.github.io/betteroll-swade/

### Dependencies

* **SWADE Ultimage Condition Changer (SUCC):** This module allows you to change the SWADE status icons along with some other things. It also provides a strong API that Better Rolls now makes use of. You will need SUCC in order to use Better Rolls.
* **Settings Extender**: A library that makes easier working with settings.

### Integrations

* **Dice so Nice:** This module supports using a different theme for the damage dice when you are using Dice so Nice. You can select it in the module settings (see above)
* **Dice Tray:** If Dice Tray is enabled, better rolls will use it's modifier box in addition to all other options.


### Known incompatibilities

* SWADE Tools and Better Rolls implement similar things in very different ways. Since both modules affect the same functionalities, neither can live while the other survives (please don't have them active at the same time).
* ModBox and Better Rolls do not work together

## Authors

- JuanV, base of drag and drop support, custom bennies, translation infrastructure.
- SalieriC, too many things to list.
- Kandashi, manual ammunition management.
- Sergut, documentation corrections.
- Razortide, documentation, the best parts of this doc are his.
- Javier Rivera, maintainer.
- Art assets shipped with the system are attributed by a README file in the same directory.
- The shipped bennies are property of Classical Numismatic Group, Inc.
- zn-sk, too many contributions to remember all

## Translations
- Translations are now managed in [Weblate](https://trans.etranslator.eu/projects/better-rolls-swade-2/), please feel free to help.

## Acknowledgements
- All the people reporting bugs and opening issues. Without them this module would be far worse.
- Atropos for making Foundry VTT
- RedReign for Better Rolls 5e
- FloRad for making the SWADE system for Foundry
- Lipefl, author of swade-tools, for inspiration and just shameless code ripping.
- Torg system team and @rwanoux for allowing me to use it's great token bars.
- All the nice people in the #swade channel of the official discord. Such a great community,

## License
The source code is licensed under GPL-3.0.
