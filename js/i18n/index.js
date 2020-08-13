/**
 * Created by Uncle Charlie, 2017/12/06
 */
import _ from 'lodash';
import I18n, { getLanguages } from 'react-native-i18n';
import CacheService from '../services/cache';
import AcStorage from '../utils/AcStorage';
import en from './locales/en';
import zh from './locales/zh-Hans-CN';
import tw from './locales/zh-Hant-TW';
import assert from '../utils/assert0';

// locale 格式：语言-子种类-地区
export const LANG_KEYS = { EN: 'en', SIMPLIFIED_CN: 'zh-Hans-CN', TRADIATIONAL_CN: 'zh-Hant-ANY' };
export const CURRENT_LOCALE_KEY = 'com_forceclouds_current_locale';
const SIMPLIFIED_REG = /^zh(.*Hans|(_|-)CN$)/; // Hans or Hant 是用来匹配系统 locale 值的关键，CN TW 是用来匹配后台配置的 locale 值的。
const TRADIATIONAL_REG = /^zh(.*Hant|(_|-)TW$)/;
const EN_REG = /^en/;

// I18n.locale = 'zh';

const languageArr = [
  {
    key: LANG_KEYS.SIMPLIFIED_CN,
    isPreset: false,
    label: () => '中文简体',
    match: (key) => SIMPLIFIED_REG.test(key),
  },
  {
    key: LANG_KEYS.TRADIATIONAL_CN,
    isPreset: false,
    label: () => '中文繁體',
    match: (key) => TRADIATIONAL_REG.test(key),
  },
  { key: LANG_KEYS.EN, isPreset: false, label: () => 'English', match: (key) => EN_REG.test(key) },
];

// keys of languages from cache
let cacheKeys = [];
// TODO: 可以在 lang 函数匹配后，将该 key 从 cacheKeys 移除以做优化
function getLanguageList() {
  return cacheKeys.length > 0
    ? languageArr.filter((lang) => cacheKeys.some((key) => lang.match(key)))
    : languageArr;
}

function combineTranslations(obj) {
  for (const key in obj) {
    const i18nKey = (languageArr.find((lang) => lang.match(key)) || {}).key;
    if (i18nKey && I18n.translations[i18nKey]) {
      Object.assign(I18n.translations[i18nKey], obj[key]);
    } else {
      I18n.translations[key] = obj[key];
    }
  }
}

//从翻译控制台中找到对应的field翻译，参数都是必填且类型都是string
function t_object_field(object, field, defaultValue) {
  assert(_.isString(object));
  assert(_.isString(field));
  assert(_.isString(defaultValue));
  const key = `field.${object}.${field}`;
  return I18n.t(key, { defaultValue });
}

//单选项，对应的key格式为 options.<object_api_name>.<field_api_name>.<field_value>
function t_object_options_value(object_api_name, field_api_name, field_value) {
  const previous_missingTranslation = I18n.missingTranslation;
  I18n.missingTranslation = function() {
    return undefined;
  };

  assert(_.isString(object_api_name));
  assert(_.isString(field_api_name));
  const key = `options.${object_api_name}.${field_api_name}.${field_value}`;
  const result = I18n.t(key);
  if (!result) {
    console.log('未找到翻译' + key);
  }
  I18n.missingTranslation = previous_missingTranslation;
  return result;
}

function reset() {
  I18n.defaultSeparator = '/';
  I18n.fallbacks = false;
  I18n.translations = {
    [LANG_KEYS.EN]: en,
    [LANG_KEYS.SIMPLIFIED_CN]: zh,
    [LANG_KEYS.TRADIATIONAL_CN]: tw,
  };
}

/**
 * 使用缓存是数据初始化 I18n
 * @param {*} data
 */
function init() {
  I18n.locale = findLangOfLocale(I18n.locale) || LANG_KEYS.EN;

  CacheService.laodMultCache()
    .then(([e, res]) => {
      // combine intlAllLan
      config(res);
    })
    .then(() => {
      AcStorage.get(CURRENT_LOCALE_KEY).then((res) => {
        // set locale
        config({ [CURRENT_LOCALE_KEY]: JSON.parse(res) });
      });
    });
}

const findLangOfLocale = (locale) => (languageArr.find((lang) => lang.match(locale)) || {}).key;

/**
 * 这里使用内存数据刷新 I18n 配置，如果需要使用缓存，请使用 init 函数
 * @param {*} data
 */
function refresh(data) {
  config(data);
}

/**
 * 合并语言库，优选配置用户已选择的语言，其次为服务端配置的语言
 * @param {*} data
 */
function config(data) {
  if (data.intlAllLan) {
    combineTranslations(data.intlAllLan);
    cacheKeys = Object.keys(data.intlAllLan);
  }

  if (data[CURRENT_LOCALE_KEY]) {
    // 优先选择 CURRENT_LOCALE_KEY
    I18n.locale = data[CURRENT_LOCALE_KEY];
  } else if (data.intlType) {
    I18n.locale = languageArr.find((lang) => !lang.isPreset && lang.match(data.intlType)).key;
  }
}

// 语言选择功能专用模块
function setLocale(locale) {
  I18n.locale = locale;
  return AcStorage.save({ [CURRENT_LOCALE_KEY]: locale });
}

function getLocale() {
  return I18n.locale;
}

// get locale and convert into langKey
function getSystemLocale() {
  return getLanguages().then(
    (
      res, // res 为系统的偏好语言的顺序，第一个也就是所选中的系统语言
    ) => (languageArr.find((lang) => lang.match(res[0])) || {}).key,
  );
}

//从布局中找到headerTitle。优先顺序：'layout.i18n_key'并翻译、display_name不翻译、默认值
function t_layout_headerTitle(layout, defaultValue) {
  const i18n_key = _.get(layout, 'layout.i18n_key');
  if (_.isString(i18n_key) && !_.isEmpty(i18n_key)) {
    const translatedStr = I18n.t(i18n_key);
    if (_.isString(translatedStr) && !_.isEmpty(translatedStr)) {
      return translatedStr;
    }
  }

  const display_name = _.get(layout, 'display_name', defaultValue);
  return display_name;
}

export default (function() {
  reset();
  init();
  return Object.assign(I18n, {
    getLocale,
    getLanguages,
    getLanguageList,
    combineTranslations,
    init,
    reset,
    config,
    refresh,
    setLocale,
    getSystemLocale,
    t_object_field,
    t_object_options_value,
    t_layout_headerTitle,
  });
})();
