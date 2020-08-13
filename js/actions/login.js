/*
  Created by Uncle Charlie, 2017/11/22
 */

const LOGIN_START = 'login/start_login';
const LOGIN_SUCCESS = 'login/login_success';
const LOGIN_FAILED = 'login/login_failed';

const LOGOUT_START = 'login/logout_start';
const LOGOUT_FAILED = 'login/logout_failed';
const LOGOUT_SUCCESS = 'login/logout_success';

const CHANGE_PASSWORD_START = 'login/change_password_start';
const CHANGE_PASSWORD_SUCCESS = 'login/change_password_success';
const CHANGE_PASSWORD_FAILED = 'login/change_password_failed';

const FINDPWD_START = 'findPwd/start_findPwd';
const FINDPWD_SUCCESS = 'findPwd/findPwd_success';
const FINDPWD_FAILED = 'findPwd/findPwd_failed';

const CLEAR_LOGOUT = 'login/clear_and_logout';

export function loginAction(userInfo) {
  return {
    type: LOGIN_START,
    payload: userInfo,
  };
}

export function logoutAction() {
  return {
    type: LOGOUT_START,
  };
}

export function clearLogoutAction() {
  return {
    type: CLEAR_LOGOUT,
  };
}

export function findPwdAction(userInfo) {
  return {
    type: FINDPWD_START,
    payload: userInfo,
  };
}

export function changePassWordAction(payload) {
  return {
    type: CHANGE_PASSWORD_START,
    payload,
  };
}
export {
  LOGIN_START,
  LOGIN_SUCCESS,
  LOGIN_FAILED,
  LOGOUT_START,
  LOGOUT_FAILED,
  LOGOUT_SUCCESS,
  CHANGE_PASSWORD_START,
  CHANGE_PASSWORD_SUCCESS,
  CHANGE_PASSWORD_FAILED,
  FINDPWD_START,
  FINDPWD_SUCCESS,
  FINDPWD_FAILED,
  CLEAR_LOGOUT,
};
