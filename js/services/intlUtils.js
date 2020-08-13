import _ from 'lodash';
import I18n from 'react-native-i18n';
import crmintl from 'crmintl';
import moment from 'moment';
import Globals from '../utils/Globals';
import { api, baseURL } from '../utils/config';
import HttpRequest from './httpRequest';
import CacheService from './cache';
import AStorage from '../utils/asStorage';
import assert from '../utils/assert0';

const { all_language, default_language, home_config } = api;
const CACHE_KEY = ['intlType', 'intlAllLan'];
const Hant_RE = /^(zh-Hant)/;
const TW_RE = /^(zh).*(TW)$/;
const ZH_RE = /^zh/;
const EN_RE = /^en/;

//获得home_config对应的url path
function f_home_config_urlpath(profile) {
  const app_authorize = profile.app_authorize;
  let phoneHomeConfig_found = 'home_config'; //backward compatible
  if (_.isArray(app_authorize) && !_.isEmpty(app_authorize)) {
    for (let i = 0; i < app_authorize.length; i++) {
      const elem = app_authorize[i];
      assert(_.isObject(elem));
      const { appName, phoneHomeConfing } = elem;
      assert(_.isString(appName));
      assert(_.isString(phoneHomeConfing));
      if (appName === 'CRM') {
        phoneHomeConfig_found = phoneHomeConfing;
        break;
      }
    }
  }
  const urlPath = home_config.replace('{phoneHomeConfing}', phoneHomeConfig_found);
  return urlPath;
}

export default class IntlUtils {
  /**
   *
   * @param {*} type *优先接收传入的type，其次是storage和系统
   * @param {*} data 接收后端自定义data
   * @return 返回最终数据
   */
  static init() {
    const intlType = this.getSystem();

    this.setIntl(intlType, {});
  }

  static async loadIntlCaches(intlParams) {
    let intlType;
    let intlAllLan;
    if (!_.isEmpty(intlParams)) {
      intlType = _.get(intlParams, 'intlType', '');
      intlAllLan = _.get(intlParams, 'intlAllLan', {});
    } else {
      const [err, result] = await CacheService.laodMultCache(CACHE_KEY);
      if (err) {
        console.error('[error]intl init err');
      }
      intlType = _.get(result, 'intlType', '');
      intlAllLan = _.get(result, 'intlAllLan', {});
    }

    if (!intlType) {
      intlType = this.getSystem();
    }
    this.setIntl(intlType, intlAllLan);
  }

  /**
   *
   * @param {*} IntlType
   * @param {*} data 从server或本地storage获取的多语言设置
   */
  static setIntl(IntlType, data) {
    const intlData = crmintl.setIntl(data, IntlType);
    Globals.setIntlUtilData(intlData);
    return intlData;
  }

  static async getDefaultLan(token, headerLogs = {}) {
    const languageSettingUrl = baseURL + default_language.replace('query', token);
    const result = await HttpRequest.basicGetQuery(languageSettingUrl, headerLogs);
    return _.get(result, 'value', 'zh');
  }

  static async getHomeConfig(token, headerLogs = {}, profile) {
    const homeConfigUrl = baseURL + f_home_config_urlpath(profile).replace('query', token);
    const result = await HttpRequest.basicGetQuery(homeConfigUrl, headerLogs);
    const value = _.get(result, 'value', JSON.stringify({}));
    return JSON.parse(_.toString(value));
  }

  static async getAllLan(token, headerLogs = {}) {
    const allLanguageUrl = baseURL + all_language.replace('query', token);
    const result = await HttpRequest.basicGetQuery(allLanguageUrl, headerLogs);
    return result || {};
  }

  static getSystem() {
    const systemType = I18n.locale;
    if (Hant_RE.test(systemType) || TW_RE.test(systemType)) {
      moment.locale('zh-cn', {
        week: {
          dow: 1,
        },
      });
      return 'zh_TW';
    } else if (ZH_RE.test(systemType)) {
      moment.locale('zh-cn', {
        week: {
          dow: 1,
        },
      });
      return 'zh';
    } else if (EN_RE.test(systemType)) {
      moment.locale('en', {
        week: {
          dow: 0,
        },
      });
      return 'en_US';
    } else {
      moment.locale('zh-cn', {
        week: {
          dow: 1,
        },
      });
      return 'zh';
    }
  }
}
