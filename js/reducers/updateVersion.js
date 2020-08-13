/**
 * @flow
 */
import _ from 'lodash';
import {
  UPDATE_VERSION_ERROR,
  UPDATE_VERSION_SUCCESS,
  UPDATE_VERSION_START,
  CLEAR_UPDATE_VERSION,
} from '../actions/updateVersion';

const initState = {
  loading: false,
  error: false,
  success: false,
  needUpdate: false,
  data: {
    app_version: '',
    is_force_update: true,
    update_description: '',
    update_type: 0,
    ios_download_link: '',
    android_download_link: '',
  },
};

export default function loginReducer(state = initState, action = {}) {
  if (action.type === UPDATE_VERSION_START) {
    return {
      loading: true,
      success: false,
      error: false,
    };
  } else if (action.type === UPDATE_VERSION_ERROR) {
    return {
      loading: false,
      success: false,
      error: true,
    };
  } else if (action.type === UPDATE_VERSION_SUCCESS) {
    const { payload } = action;

    if (_.isEmpty(payload)) {
      return initState;
    }

    if (payload.update_type == 2) {
      // *当前是最新的
      return { data: payload, needUpdate: false, loading: false, success: true, error: false };
    }

    return {
      data: payload,
      needUpdate: true,
      loading: false,
      success: true,
      error: false,
    };
  } else if (action.type === CLEAR_UPDATE_VERSION) {
    return initState;
  }
  return state;
}
