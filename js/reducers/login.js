/**
 * Created by Uncle Charlie, 2017/12/06
 */
import _ from 'lodash';
import {
  LOGIN_START,
  LOGIN_FAILED,
  LOGIN_SUCCESS,
  LOGOUT_SUCCESS,
  CLEAR_LOGOUT,
} from '../actions/login';
import I18n from '../i18n';
import { intlValue } from '../utils/crmIntlUtil';
import { toastSuccess, toastWaring, toastError } from '../utils/toast';

const initState = {
  loading: false,
  success: 0, // 0: default, 1: success, 2: fail
};

export default function loginReducer(state = initState, action = {}) {
  const message = _.get(action, 'message.message', `${I18n.t('action.operation_failed')}`);
  if (action.type === LOGIN_START) {
    return {
      ...state,
      loading: true,
      success: 0,
    };
  } else if (action.type === LOGIN_SUCCESS) {
    toastSuccess(intlValue('message.welcome_back'));
    return {
      ...state,
      loading: false,
      success: 1,
    };
  } else if (action.type === LOGIN_FAILED) {
    return {
      ...state,
      loading: false,
      success: 2,
    };
  } else if (action.type === LOGOUT_SUCCESS) {
    toastSuccess(I18n.t('message.logout_success'));
    return {
      loading: false,
      success: 2,
    };
  } else if (action.type === CLEAR_LOGOUT) {
    toastSuccess(I18n.t('message.logout_success'));
    return {
      loading: false,
      success: 2,
    };
  }
  return state;
}
