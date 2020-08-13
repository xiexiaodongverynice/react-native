/**
 *Created by Guanghua on 01/19;
 */
import { call, put, takeEvery } from 'redux-saga/effects';
import _ from 'lodash';
import {
  RECORD_UPDATE_START,
  RECORD_UPDATE_SUCCESS,
  RECORD_UPDATE_FAILED,
} from '../actions/recordUpdate';
import recordService from '../services/recordService';
import { handleResult } from '../utils/handler';

function* recordUpdate(action) {
  try {
    const data = yield call(recordService.updateRecord, action.payload);
    if (data) {
      yield put({ type: RECORD_UPDATE_SUCCESS, payload: data, showAlert: action.showAlert });
      const { callback } = action;
      if (_.isFunction(callback)) {
        callback();
      }
    } else {
      yield put({ type: RECORD_UPDATE_FAILED });
    }
  } catch (e) {
    yield put({ type: RECORD_UPDATE_FAILED, message: e.message });
    console.error(e);
  }
}

export default function* watchRecordUpdate() {
  yield takeEvery(RECORD_UPDATE_START, recordUpdate);
}
