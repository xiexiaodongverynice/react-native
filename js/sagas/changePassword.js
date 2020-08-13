/**
 *Created by Guanghua on 12/18;
 */

import { call, put, takeEvery } from 'redux-saga/effects';
import _ from 'lodash';
import {
  CHANGE_PASSWORD_START,
  CHANGE_PASSWORD_SUCCESS,
  CHANGE_PASSWORD_FAILED,
  LOGOUT_START,
} from '../actions/login';
import I18n from '../i18n';
import userService from '../services/userService';

function* doChangePassword(action) {
  try {
    const data = yield call(userService.changePassword, action.payload);
    console.log('doChangePassword=> data', data);
    const responseCode = _.get(data, 'head.code', '');
    const message = _.get(data, 'head.msg', '');
    if (_.isEqual(responseCode, 200)) {
      yield put({ type: CHANGE_PASSWORD_SUCCESS, message });
      yield put({ type: LOGOUT_START });
    } else {
      yield put({ type: CHANGE_PASSWORD_FAILED, message });
    }
  } catch (e) {
    const message = `${e}`.search(/^Error:/) >= 0 ? `${e}`.replace('Error:', '') : `${e}`;
    yield put({ type: CHANGE_PASSWORD_FAILED, message });
  }
}

export default function* watchChangePassword() {
  yield takeEvery(CHANGE_PASSWORD_START, doChangePassword);
}
