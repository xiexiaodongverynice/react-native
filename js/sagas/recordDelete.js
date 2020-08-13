/**
 *Created by Guanghua on 01/25;
 */
import { call, put, takeEvery } from 'redux-saga/effects';
import { DeviceEventEmitter } from 'react-native';
import _ from 'lodash';
import {
  RECORD_DELETE_START,
  RECORD_DELETE_SUCCESS,
  RECORD_DELETE_FAILED,
} from '../actions/recordDelete';
import recordService from '../services/recordService';
import { BUSEVENT_NEED_REFRESH_DETAIL } from '../actions/event';
import assert from '../utils/assert0';

function* recordDelete(action) {
  try {
    const data = yield call(recordService.deleteRecord, action.payload);
    if (data) {
      yield put({ type: RECORD_DELETE_SUCCESS, payload: data });
      const { callback } = action;
      if (_.isFunction(callback)) {
        callback();
      }

      //删除 event_attendee 后，需要更新event详情
      if (action.payload.objectApiName === 'event_attendee') {
        assert(_.isNumber(action.extra.eventId));
        DeviceEventEmitter.emit(BUSEVENT_NEED_REFRESH_DETAIL, action.extra.eventId);
      }
    } else {
      yield put({ type: RECORD_DELETE_FAILED });
    }
  } catch (e) {
    yield put({ type: RECORD_DELETE_FAILED, message: e.message });
    console.error(e);
  }
}

export default function* watchRecordDelete() {
  yield takeEvery(RECORD_DELETE_START, recordDelete);
}
