/**
 * Created by Uncle Charlie, 2017/12/06
 */
import _ from 'lodash';
import {
  SETTINGS_CACHE_LOAD_SUCCESS,
  SETTINGS_CACHE_LOAD_FAILED,
  SET_REQUESTED_VALUES,
  SETTINGS_RESET_CACHE,
  SETTINGS_SWITCH_LOCALE,
} from '../actions/cache';
import Utils from '../utils/constants';
import { toastSuccess } from '../utils/toast';
import I18n from '../i18n';

const initState = {
  locale: null,
  userInfo: null,
  token: null,
  profile: null,
  permission: null,
  crmPowerSetting: null,
  tabs: null,
  fullProfile: null,
  objectDescription: null,
  homeConfig: null,
  intlType: '',
  intlAllLan: {},
  loading: 0, // 0: start status, 1: loaded, 2: not loaded 3:changeTerritory
  userTerritoryList: [], // 岗位列表
};

export default function cacheReducer(state = initState, action = {}) {
  if (action.type === SETTINGS_CACHE_LOAD_SUCCESS) {
    const cacheValues = _.get(action, 'payload.data[1]');
    if (_.isEmpty(cacheValues)) {
      return { ...initState, loading: 2 };
    }
    return { ...cacheValues, loading: 1 };
  } else if (action.type === SETTINGS_CACHE_LOAD_FAILED) {
    return {
      ...state,
      loading: 2,
    };
  } else if (action.type === SET_REQUESTED_VALUES) {
    const userTerritoryList = _.get(action.payload, 'userTerritoryList', []);
    return {
      ...action.payload,
      loading: _.isEmpty(userTerritoryList) ? 1 : 3,
    };
  } else if (action.type === SETTINGS_RESET_CACHE) {
    toastSuccess(I18n.t('message.logout_success'));
    return {
      loading: 0,
    };
  } else if (action.type === SETTINGS_SWITCH_LOCALE) {
    return {
      ...state,
      locale: action.payload.data,
    };
  }

  return state;
}
