// /**
//  * Created by Uncle Charlie, 2017/12/06
//  */

import { call, put, takeEvery } from 'redux-saga/effects';
import { SETTINGS_RESET_CACHE } from '../actions/cache';
import I18n from '../i18n';
import { LOGOUT_START } from '../actions/login';
import userService from '../services/userService';

function* doLogout(action) {
  // * 登出
  yield call(userService.logout);
  yield put({ type: SETTINGS_RESET_CACHE });
}

export function* watchLogout() {
  yield takeEvery(LOGOUT_START, doLogout);
}
