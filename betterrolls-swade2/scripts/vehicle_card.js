// Functions for cards representing vehicles
/* globals Token, game, ui, fromUuid */
// noinspection JSCheckFunctionSignatures

import {
  get_action_from_click,
} from "./cards_common.js";
import { trait_from_string } from "./item_card.js";

/**
 * Creates a card after an event.
 * @param ev javascript click event
 * @param {SwadeActor, Token} target token or actor from the char sheet
 */
async function vehicle_click_listener(ev, target) {
  const action = get_action_from_click(ev);
  if (action === "system") {
    return;
  }
  ev.stopImmediatePropagation();
  ev.preventDefault();
  ev.stopPropagation();

  const vehicle_actor = target.actor ?? target;

  const driver_actor = fromUuidSync(vehicle_actor.system.driver.id);
  if (!driver_actor) {
    return;
  }
  
  const skill_id = vehicle_actor.system.driver.skill || vehicle_actor.system.driver.skillAlternative;
  if (!skill_id) {
    ui.notifications.warn(game.i18n.localize("BRSW.VehicleOperationSkillNotSetError"));
    return;
  }

  let skill = trait_from_string(driver_actor, skill_id);
  if (!skill) {
    ui.notifications.warn(game.i18n.localize("BRSW.VehicleCharacterSkillMissingError"));
    return;
  }

  // Show card
  let br_card = await game.brsw.create_skill_card(driver_actor, skill.id, {vehicle:target});
  if (action.includes("dialog")) {
    game.brsw.dialog.show_card(br_card);
  } else if (action.includes("trait")) {
    await roll_skill(br_card, false);
  }
}

/**
 * Activates the listeners in the vehicle sheet
 * @param app Sheet app
 * @param html Html code
 */
export function activate_vehicle_listeners(app, html) {
  let target = app.token || app.object;
  const skill_labels = html.find("button[id='maneuverCheck']");
  skill_labels.bindFirst("click", async (ev) => {
    await vehicle_click_listener(ev, target);
  });
}
