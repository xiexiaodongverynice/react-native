/**
 *Created by Guanghua on 12/18 ;
 */

import { CHANGE_PASSWORD_SUCCESS, CHANGE_PASSWORD_FAILED } from '../actions/login';
import _ from 'lodash';
import { Toast } from 'native-base';
import { toastSuccess, toastWaring, toastError } from '../utils/toast';

const initState = {
  loading: true,
  changePasswordSuccess: 0, // 0: default, 1: success, 2: fail
};

export default function changePasswordReducer(state = initState, action = {}) {
  const message = _.get(action, 'message');
  if (action.type === CHANGE_PASSWORD_SUCCESS) {
    // toastSuccess(`${message}`);
    return {
      ...state,
      loading: false,
      changePasswordSuccess: 1,
    };
  } else if (action.type === CHANGE_PASSWORD_FAILED) {
    toastError(`${message}`);
    return {
      ...state,
      loading: false,
      changePasswordSuccess: 2,
    };
  }
  return state;
}
