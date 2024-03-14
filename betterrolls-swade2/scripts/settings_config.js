// An aplication to manage the settings
/* global FormApplication, mergeObject, game, foundry, Dialog */

import { SettingsUtils } from "./utils.js";
import {
  MODULE_NAME,
  SETTING_KEYS,
  USER_FLAGS,
  USER_SETTINGS,
  WORLD_SETTINGS,
} from "./brsw2-config.js";

export class SettingsConfig extends FormApplication {
  constructor() {
    super();
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "brsw-settings-config",
      classes: ["sheet"],
      template: "modules/betterrolls-swade2/templates/settings_config.html",
      minimizable: false,
      title: game.i18n.localize("BRSW.Settings"),
      width: 800,
      height: 700,
      resizable: true,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".content",
          initial: "enable",
        },
      ],
    });
  }

  getData() {
    const data = {
      isGM: game.user.isGM,
      world_settings: [],
      user_settings: [],
    };

    for (let setting of Object.values(WORLD_SETTINGS)) {
      data.world_settings.push(this.get_setting_data(setting));
    }

    for (let setting of Object.values(USER_SETTINGS)) {
      data.user_settings.push(this.get_setting_data(setting));
    }

    return data;
  }

  /**
   * Gets the data from a setting to pass it to handlebars
   * @param {object} setting - The setting object.
   * @returns {object} The setting data.
   */
  get_setting_data(setting) {
    const s = foundry.utils.deepClone(setting);
    s.id = s.key;
    s.name = game.i18n.localize(s.name);
    s.hint = game.i18n.localize(s.hint);
    s.value = s.value !== undefined ? s.value : s.default;
    s.type = setting.type instanceof Function ? setting.type.name : "String";
    s.isCheckbox = setting.type === Boolean;
    s.isSelect = s.choices !== undefined;
    s.isRange = setting.type === Number && s.range;
    s.isNumber = setting.type === Number;
    return s;
  }

  async _updateObject(event, formData) {
    let requires_world_reload = false;
    let requires_client_reload = false;
    for (let [k, v] of Object.entries(foundry.utils.flattenObject(formData))) {
      if (WORLD_SETTINGS[k] && WORLD_SETTINGS[k].value !== v) {
        WORLD_SETTINGS[k].value = v;
        requires_world_reload =
          requires_world_reload || WORLD_SETTINGS[k].requiresReload;
      } else if (USER_SETTINGS[k] && USER_SETTINGS[k].value !== v) {
        USER_SETTINGS[k].value = v;
        requires_client_reload =
          requires_client_reload || USER_SETTINGS[k].requiresReload;
      }
    }

    await SettingsUtils.setSetting(SETTING_KEYS.world_settings, WORLD_SETTINGS);

    await game.user.unsetFlag(MODULE_NAME, USER_FLAGS.user_settings);
    await game.user.setFlag(
      MODULE_NAME,
      USER_FLAGS.user_settings,
      USER_SETTINGS,
    );

    if (requires_world_reload || requires_client_reload) {
      await this.constructor.reloadConfirm({ world: requires_world_reload });
    }
  }

  /**
   * Shows a confirmation dialog for reloading the game.
   * @param {object} options - The reload options.
   */
  static async reloadConfirm({ world = false } = {}) {
    const reload = await Dialog.confirm({
      title: game.i18n.localize("SETTINGS.ReloadPromptTitle"),
      content: `<p>${game.i18n.localize("SETTINGS.ReloadPromptBody")}</p>`,
    });
    if (!reload) {
      return;
    }
    if (world && game.user.isGM) {
      game.socket.emit("reload");
    }
    foundry.utils.debouncedReload();
  }
}
