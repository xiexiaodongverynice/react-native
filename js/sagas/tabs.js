/**
 * Created by Uncle Charlie, 2017/12/10
 */
import { takeEvery, call, put } from 'redux-saga/effects';
import tabsAction, { TABS_LOAD_START, TABS_LOAD_FAILED, TABS_LOAD_SUCCESS } from '../actions/tabs';
import fetchTabs from '../services/tabs';

function* requestTabs(action) {
  try {
    const data = yield call(fetchTabs, action.token);
    yield put({ type: TABS_LOAD_SUCCESS, payload: data });
  } catch (e) {
    console.log('==tabs saga error', e);
    yield put({ type: TABS_LOAD_FAILED });
  }
}

export default function* watchTabs() {
  yield takeEvery(TABS_LOAD_START, requestTabs);
}
