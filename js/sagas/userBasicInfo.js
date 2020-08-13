/**
 * Create by Uncle Charlie, 2/1/2018
 * @flow
 */

import { takeEvery, call, put } from 'redux-saga/effects';
import {
  USER_INFO_QUERY_FAILED,
  USER_INFO_QUERY_START,
  USER_INFO_QUERY_SUCCESS,
} from '../actions/userBasicInfo';
import HttpRequest from '../services/httpRequest';

function* queryUserInfo(action) {
  try {
    const data = yield call(HttpRequest.queryUserBasicInfo, action.payload);
    if (!data) {
      yield put({ type: USER_INFO_QUERY_FAILED });
    } else {
      yield put({ type: USER_INFO_QUERY_SUCCESS, payload: data });
    }
  } catch (e) {
    yield put({ type: USER_INFO_QUERY_FAILED });
  }
}

export default function* watchUserInfo() {
  yield takeEvery(USER_INFO_QUERY_START, queryUserInfo);
}
