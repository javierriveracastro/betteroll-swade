import * as BRSW2_CONFIG from "./brsw2-config.js";
import { Utils } from "./utils.js";

export class SettingsConfig extends FormApplication {
  constructor() {
    super();
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "brsw-settings-config",
      classes: ["sheet"],
      template: "modules/betterrolls-swade2/templates/settings_config.html",
      resizable: false,
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

    for (let setting of Object.values(BRSW2_CONFIG.WORLD_SETTINGS)) {
      const s = foundry.utils.deepClone(setting);
      s.id = s.key;
      s.name = game.i18n.localize(s.name);
      s.hint = game.i18n.localize(s.hint);
      s.value = s.value != undefined ? s.value : s.default;
      s.type = setting.type instanceof Function ? setting.type.name : "String";
      s.isCheckbox = setting.type === Boolean;
      s.isSelect = s.choices !== undefined;
      s.isRange = setting.type === Number && s.range;
      s.isNumber = setting.type === Number;

      data.world_settings.push(s);
    }

    for (let setting of Object.values(BRSW2_CONFIG.USER_SETTINGS)) {
      const s = foundry.utils.deepClone(setting);
      s.id = s.key;
      s.name = game.i18n.localize(s.name);
      s.hint = game.i18n.localize(s.hint);
      s.value = s.value != undefined ? s.value : s.default;
      s.type = setting.type instanceof Function ? setting.type.name : "String";
      s.isCheckbox = setting.type === Boolean;
      s.isSelect = s.choices !== undefined;
      s.isRange = setting.type === Number && s.range;
      s.isNumber = setting.type === Number;

      data.user_settings.push(s);
    }

    return data;
  }

  async _updateObject(event, formData) {
    let requires_world_reload = false;
    let requires_client_reload = false;
    for (let [k, v] of Object.entries(foundry.utils.flattenObject(formData))) {
      if (
        BRSW2_CONFIG.WORLD_SETTINGS[k] &&
        BRSW2_CONFIG.WORLD_SETTINGS[k].value != v
      ) {
        BRSW2_CONFIG.WORLD_SETTINGS[k].value = v;
        requires_world_reload =
          requires_world_reload ||
          BRSW2_CONFIG.WORLD_SETTINGS[k].requiresReload;
      } else if (
        BRSW2_CONFIG.USER_SETTINGS[k] &&
        BRSW2_CONFIG.USER_SETTINGS[k].value != v
      ) {
        BRSW2_CONFIG.USER_SETTINGS[k].value = v;
        requires_client_reload =
          requires_client_reload ||
          BRSW2_CONFIG.USER_SETTINGS[k].requiresReload;
      }
    }

    await Utils.setSetting(
      BRSW2_CONFIG.SETTING_KEYS.world_settings,
      BRSW2_CONFIG.WORLD_SETTINGS,
    );

    await game.user.unsetFlag(
      BRSW2_CONFIG.MODULE_NAME,
      BRSW2_CONFIG.USER_FLAGS.user_settings,
    );
    await game.user.setFlag(
      BRSW2_CONFIG.MODULE_NAME,
      BRSW2_CONFIG.USER_FLAGS.user_settings,
      BRSW2_CONFIG.USER_SETTINGS,
    );

    if (requires_world_reload || requires_client_reload) {
      this.constructor.reloadConfirm({ world: requires_world_reload });
    }
  }

  static async reloadConfirm({ world = false } = {}) {
    const reload = await Dialog.confirm({
      title: game.i18n.localize("SETTINGS.ReloadPromptTitle"),
      content: `<p>${game.i18n.localize("SETTINGS.ReloadPromptBody")}</p>`,
    });
    if (!reload) return;
    if (world && game.user.isGM) game.socket.emit("reload");
    foundry.utils.debouncedReload();
  }
}
