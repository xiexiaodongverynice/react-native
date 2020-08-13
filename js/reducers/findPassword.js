import { FINDPWD_SUCCESS, FINDPWD_FAILED } from '../actions/login';
import { toastSuccess, toastWaring, toastError } from '../utils/toast';
import { intlValue } from '../utils/crmIntlUtil';

const initState = {
  disabled: true,
  success: 0, // 0: default, 1: success, 2: fail
};

export default function findPasswordReducer(state = initState, action = {}) {
  if (action.type === FINDPWD_SUCCESS) {
    toastSuccess(intlValue('message.find_password_success_msg'));
    return {
      ...state,
      disabled: false,
      success: 1,
    };
  } else if (action.type === FINDPWD_FAILED) {
    toastError(intlValue('message.find_password_fail_msg'));
    return {
      ...state,
      disabled: false,
      success: 2,
    };
  }

  return state;
}
