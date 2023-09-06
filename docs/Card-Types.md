The **Better Rolls 2 for Savage Worlds** module has a number of different card types; Attribute, Skill, Item, Arcane Device and Soak

## Attribute card

This is the card that is shown after clicking on an attribute name:

![Attribute card more options](https://github.com/javierriveracastro/betteroll-swade/blob/version_2/docs/img/Attribute_car_more_options.png?raw=true)

## Skill card

The skill cards are very similar to attribute ones. Please note the collapsed skill description. When rolling multiple Trait dice + Wild die it will show all results.

![multiple rof result](https://github.com/javierriveracastro/betteroll-swade/blob/version_2/docs/img/result_row_multiple_rof.png?raw=true)

## Item cards

Item Cards can be broken down into different categories. Gear cards are straightforward, while weapon or power cards add a lot of functionality.

A simple item, like an armor would look like this:

![simple_armor](https://github.com/javierriveracastro/betteroll-swade/blob/version_2/docs/img/simple_armor_card.png?raw=true)

If there is a description available, it will show it.

### Edges and Hindrances

Edges and Hindrances, being treated as items in Foundry VTT have the same look:

![blind_core_hindrance](https://github.com/javierriveracastro/betteroll-swade/blob/version_2/docs/img/blind_edge.png?raw=true)

### Melee weapons

![Melee weapon](https://github.com/javierriveracastro/betteroll-swade/blob/version_2/docs/img/Soak_Card_v1-119.jpg?raw=true)

In this example, the damage has already been rolled. The roll will than be compared with the TN. This is usually 4, but if you have targeted another actor, it will use that actors Parry instead. As described earlier, you can use a reroll or a Benny to alter your result - all earlier rolls will be added to the "Older rolls" row above the rolls section.

If you are satisfied with your skill roll, you can go ahead and roll damage (either normal damage or raise damage):

![Melee damage](https://github.com/javierriveracastro/betteroll-swade/blob/version_2/docs/img/Weapon_Card_Damage_v1-119.jpg?raw=true)

As you can see, you can also use a Benny to reroll the damage, this will add a new row as shown above. If the damage is sufficient to cause a wound or make an opponent shaken, you will also see the "Apply damage" box. If targeted, the damage roll will be compared against the targets Toughness. (see "Soak Rolls" below)

### Ranged weapons

Ranged weapons work similar than melee weapons but their TN is always 4, if not modified in the "More options" section. In the sample below, *Vulnerable* as well as *Distracted* has been factored in this roll:

![Ranged weapon](https://github.com/javierriveracastro/betteroll-swade/blob/version_2/docs/img/Weapon_Card_Shots_and_Status_v1-119.jpg?raw=true)

Please note the "subtract ammo by default" setting in action. If you selected this option in the Settings, the "Subtract ammo" global action will be selected by default and automatically spend an amount of shots based on the amount of Trait die used (1/5/10/20/40/50). With the "Reload/Manual ammo" option you can define an amount of shots you want to reload or fire (like 6 if you want to fan the hammer in a *Deadlands* session). The weapon cannot load more bullets than its maximum capacity though.

### Power cards

Power cards are very similar to ranged weapons (if they have damaging effects).

![Power Card](https://github.com/javierriveracastro/betteroll-swade/blob/version_2/docs/img/power_card_v1-119.jpg?raw=true)

Available global actions are "Subtract Power points" - can be activated in the settings as default and "Manual PP management". The automatic solution will always deduct the base amount defined in the power. With the second option you can manually either expend or recharge Power Points.  

![Power Point Management](https://github.com/javierriveracastro/betteroll-swade/blob/version_2/docs/img/power_point_management_v1-119.jpg?raw=true)  

#### Modifiers altering power points to be spent  

With the implementation of [#341](https://github.com/javierriveracastro/betteroll-swade/issues/341), power points can now directly edited by item actions. To do so just set up an action for the power, specifying the amount of power points as "Shots Used" as in the screenshot below. Selecting the action in the chat card will then result in power point usage equal to the amount specified in that action. This allows the user to set up power modifiers in advance, making sure the proper power point amount is spent without the need to manually edit them each roll.  

![Power Point Modifiers](https://github.com/javierriveracastro/betteroll-swade/blob/version_2/docs/img/power_point_modifiers.png?raw=true)  
  
### Arcane Devices (by SalieriC)  

*With the introduction of Arcane Devices to the core system, this feature is about to be deprecated once BR2 supports the system Arcane Device system.*  
The automated PP Management also supports Arcane Devices created with the Artificer Edge, this however requires you to set up an Additional Stat. Head to the System configuration and set up a new Additional Stat for items. The `Stat Key` *must* be exactly this: `devicePP`  
The name doesn't matter, data type is `Number` and also check the checkbox "Has Max Value".  
From now on you can make any power an Arcane Device by activating the Additional Stat you've just created on the power. If that Additional Stat is activated, the script will automatically detect it as an Arcane Device and use the Power Points stored on the Power itself, not the ones of the character.  

## Soak Rolls

![Soak card](https://github.com/javierriveracastro/betteroll-swade/blob/version_2/docs/img/Soak_Card_v1-119.jpg?raw=true)

When an actor has been targeted and damaged using the "Apply damage" button, the "Soak card" will appear. This will allow the actor to make a "Soak (Vigor) roll" to spend a Benny and soak damage. This will only be available, if there are Bennies left to spend.
