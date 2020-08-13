/**
 * Created by Uncle Charlie, 2018/03/07
 */

import { call, put, takeEvery } from 'redux-saga/effects';
import { DeviceEventEmitter } from 'react-native';
import {
  ADD_EVENT_ATTENDEE_START,
  ADD_EVENT_ATTENDEE_SUCCESS,
  ADD_EVENT_ATTENDEE_FAILED,
  addAttendee,
  EVENT_NEED_REFRESH_ATTENDEE,
  BUSEVENT_NEED_REFRESH_DETAIL,
} from '../actions/event';
import HttpRequest from '../services/httpRequest';
import assert from '../utils/assert0';

function* addEventAttendee(action) {
  assert(action.payload);
  assert(action.payload.objectApiName);
  assert(action.payload.eventId); //添加参与人，参与人必须要关联eventId

  try {
    const result = yield call(HttpRequest.batchCreate, action.payload);
    if (result) {
      yield put({ type: ADD_EVENT_ATTENDEE_SUCCESS, payload: result });
      yield put({
        type: EVENT_NEED_REFRESH_ATTENDEE,
        payload: {
          refreshApiName: action.payload.objectApiName,
          needRefresh: true,
          eventId: action.payload.eventId,
        },
      });

      DeviceEventEmitter.emit(BUSEVENT_NEED_REFRESH_DETAIL, action.payload.eventId);
    }
  } catch (e) {
    console.warn('===>add event attendee error in saga', e);
    yield put({ type: ADD_EVENT_ATTENDEE_FAILED, error: e });
  }
}

export default function* watchAddEventAttendee() {
  yield takeEvery(ADD_EVENT_ATTENDEE_START, addEventAttendee);
}
