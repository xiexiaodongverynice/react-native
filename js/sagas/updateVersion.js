/**
 * @flow
 */

import _ from 'lodash';
import { call, put, takeEvery } from 'redux-saga/effects';
import {
  UPDATE_VERSION_ERROR,
  UPDATE_VERSION_START,
  UPDATE_VERSION_SUCCESS,
} from '../actions/updateVersion';
import UpdateVersionService from '../services/updateVersionService';
import { isCloseUpdate } from '../utils/config';

function* getLastInfo(action) {
  // * 登出
  try {
    if (isCloseUpdate) {
      // * 关闭更新请求接口操作
      yield put({
        type: UPDATE_VERSION_SUCCESS,
        payload: {
          is_force_update: false,
          update_type: 0,
          isCloseUpdate: true,
        },
      });
    } else {
      const versionInfo: versionInfoType = yield call(UpdateVersionService.getVersionInfo);

      if (_.isEmpty(versionInfo)) {
        yield put({ type: UPDATE_VERSION_ERROR });
      } else {
        yield put({ type: UPDATE_VERSION_SUCCESS, payload: versionInfo });
      }
    }
  } catch (e) {
    yield put({ type: UPDATE_VERSION_ERROR });
    console.log('[Error updateDeviceService.getVersionInfo]', e);
  }
}

export function* watchVersionInfo() {
  yield takeEvery(UPDATE_VERSION_START, getLastInfo);
}
