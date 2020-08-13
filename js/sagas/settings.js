/**
 * Created by Uncle Charlie, 2017/12/07
 */

import { takeEvery, put, call } from 'redux-saga/effects';
import {
  SETTINGS_FETCH_FAIL,
  SETTINGS_FETCH_START,
  SETTINGS_FETCH_SUCCESS,
} from '../actions/settings';
import fetchSettings from '../services/settings';
import { SETTINGS_CACHE_LOAD_START } from '../actions/cache';

function* requestSettings(action) {
  try {
    const data = yield call(fetchSettings, action.payload);
    if (!data) {
      yield put({ type: SETTINGS_FETCH_FAIL });
    } else {
      yield put({ type: SETTINGS_FETCH_SUCCESS, payload: data });
      // TODO: load cache keys is badly needed!!!
      yield put({ type: SETTINGS_CACHE_LOAD_START });
    }
  } catch (e) {
    yield put({ type: SETTINGS_FETCH_FAIL, message: e.message });
  }
}

export default function* watchSettings() {
  yield takeEvery(SETTINGS_FETCH_START, requestSettings);
}
