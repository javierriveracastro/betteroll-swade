The **Better Rolls 2 for Savage Worlds** module has some additional functionality:

## Drag and Drop

You can also use the weapon or power icon to drag it over the actor you want to target. It will execute the "Show card and trait roll" action.

![Drag and Drop](https://github.com/javierriveracastro/betteroll-swade/blob/version_2/docs/img/drag_and_drop_v-1-2-10.gif?raw=true)

For easier accessibility, instead of dragging the icon on an actor, you can also drag it to the macro bar, creating an automatic macro instead.

## Custom Bennies

The module comes with some custom bennies that can be found in the assets/bennies folder.

Currently, it ships with some classical roman and greek coins.

## Global actions

The module let's you define your own actions, see this [GLOBAL ACTIONS](https://github.com/javierriveracastro/betteroll-swade/wiki/Global-Actions):

## Macros and API

The following information assumes a passing knowledge of both javascript and Foundry API. It's geared towards macro or module developers.

The module exposes an API in game.brsw.

* `game.brsw.add_actions(actions)`: Can be used to add an array of actions to the available ones. The array should be in the same format as builtin-actions.js. The array is cleared when reloading and should be set again

You can learn more about this at: [GLOBAL ACTIONS API](https://github.com/javierriveracastro/betteroll-swade/wiki/Global-Actions#api).
