// An aplication to manage the settings
/* global FormApplication, game, foundry, Dialog, $ */

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
    return foundry.utils.mergeObject(super.defaultOptions, {
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
    const can_modify_world = game.user.hasPermission("SETTINGS_MODIFY");
    const data = {
      can_modify_world: can_modify_world,
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
    s.value = s.value ?? 
        (typeof s.default === 'string' && s.default.startsWith('BRSW.') ? 
            game.i18n.localize(s.default) : 
            s.default
        );
    s.type = setting.type instanceof Function ? setting.type.name : "String";
    s.isCheckbox = setting.type === Boolean;
    s.isSelect = s.choices !== undefined;
    s.isRange = setting.type === Number && s.range;
    s.isNumber = setting.type === Number;
    return s;
  }

  /**
   * Activate app listeners
   * @param {*} html
   */
  activateListeners(html) {
    const restoreDefaultsButton = html.find("button[name='restore-defaults']");
    restoreDefaultsButton.on("click", async (event) =>
      this.onRestoreDefaults(event),
    );
    super.activateListeners(html);
  }

  async _updateObject(event, formData) {
    const can_modify_world = game.user.hasPermission("SETTINGS_MODIFY");
    let requires_world_reload = false;
    let requires_client_reload = false;
    for (let [k, v] of Object.entries(foundry.utils.flattenObject(formData))) {
      if (
        can_modify_world &&
        WORLD_SETTINGS[k] &&
        WORLD_SETTINGS[k].value !== v
      ) {
        WORLD_SETTINGS[k].value = v;
        requires_world_reload =
          requires_world_reload || !!WORLD_SETTINGS[k].requiresReload;
      } else if (USER_SETTINGS[k] && USER_SETTINGS[k].value !== v) {
        USER_SETTINGS[k].value = v;
        requires_client_reload =
          requires_client_reload || !!USER_SETTINGS[k].requiresReload;
      }
    }

    if (can_modify_world) {
      await SettingsUtils.setSetting(
        SETTING_KEYS.world_settings,
        WORLD_SETTINGS,
      );
    }

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

  /**
   *
   * @param {*} event
   */
  async onRestoreDefaults(event) {
    event.preventDefault();

    let content;
    const active_data_tab = $(this.form).find("a[class='item active']")[0]
      .attributes["data-tab"].nodeValue;
    switch (active_data_tab) {
      case "world":
        content = game.i18n.localize("BRSW.Settings.RestoreDefaultsWorldBody");
        break;

      case "user":
        content = game.i18n.localize("BRSW.Settings.RestoreDefaultsUserBody");
        break;
    }

    const confirmationDialog = new Dialog({
      title: game.i18n.localize("BRSW.Settings.RestoreDefaultsTitle"),
      content: content,
      buttons: {
        yes: {
          icon: `<i class="fas fa-check"></i>`,
          label: game.i18n.localize("BRSW.Yes"),
          callback: () => {
            this.restoreDefaults(active_data_tab);
          },
        },
        no: {
          icon: `<i class="fas fa-times"></i>`,
          label: game.i18n.localize("BRSW.No"),
          callback: () => {},
        },
      },
      default: "no",
      close: () => {},
    });

    confirmationDialog.render(true);
  }

  async restoreDefaults(data_tab) {
    let requires_world_reload = false;
    let requires_client_reload = false;
    if (data_tab === "world") {
      for (let setting of Object.values(WORLD_SETTINGS)) {
        if (
          setting.requiresReload &&
          setting.value !== undefined &&
          setting.value !== setting.default
        ) {
          requires_world_reload = true;
        }
        delete setting.value;
      }
    } else if (data_tab === "user") {
      for (let setting of Object.values(USER_SETTINGS)) {
        if (
          setting.requiresReload &&
          setting.value !== undefined &&
          setting.value !== setting.default
        ) {
          requires_client_reload = true;
        }
        delete setting.value;
      }
    }

    await SettingsUtils.setSetting(SETTING_KEYS.world_settings, WORLD_SETTINGS);

    await game.user.unsetFlag(MODULE_NAME, USER_FLAGS.user_settings);
    await game.user.setFlag(
      MODULE_NAME,
      USER_FLAGS.user_settings,
      USER_SETTINGS,
    );

    this.render(true);

    if (requires_world_reload || requires_client_reload) {
      await this.constructor.reloadConfirm({ world: requires_world_reload });
    }
  }
}
