/**
 * Created by Uncle Charlie, 2017/12/06
 * @flow
 */
const SETTINGS_CACHE_LOAD_START = 'splash/settings_cache_load_start';
const SETTINGS_CACHE_LOAD_FAILED = 'splash/settings_cache_load_failed';
const SETTINGS_CACHE_LOAD_SUCCESS = 'splash/settings_cache_load_success';

const SET_REQUESTED_VALUES = 'settings/set_requested_values';
const SETTINGS_RESET_CACHE = 'settings/reset_settings_cache';
const SETTINGS_SWITCH_LOCALE = 'settings/switch_locale';

export default function loadCacheAction() {
  return {
    type: SETTINGS_CACHE_LOAD_START,
  };
}

export function setCacheAction(cachedValues: any) {
  return {
    type: SET_REQUESTED_VALUES,
    payload: cachedValues,
  };
}

export function resetCacheAction() {
  return {
    type: SETTINGS_RESET_CACHE,
  };
}

export function switchLocale(locale) {
  return {
    type: SETTINGS_SWITCH_LOCALE,
    payload: {
      data: locale,
    },
  };
}

export {
  SETTINGS_CACHE_LOAD_SUCCESS,
  SETTINGS_CACHE_LOAD_START,
  SETTINGS_CACHE_LOAD_FAILED,
  SET_REQUESTED_VALUES,
  SETTINGS_RESET_CACHE,
  SETTINGS_SWITCH_LOCALE,
};
