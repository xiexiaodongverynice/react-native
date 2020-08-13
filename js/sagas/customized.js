import { call, put, takeEvery } from 'redux-saga/effects';
import {
  JMKX_LIST_SUMMURY_FAILED,
  JMKX_LIST_SUMMURY_START,
  JMKX_LIST_SUMMURY_SUCCESS,
} from '../actions/customized';
import CustomService from '../services/customized';

function* queryListSummury(action) {
  try {
    const { payload } = action;
    const data = yield call(CustomService.queryListSummury, payload);
    console.log('customized saga======> ', data);
    if (!data) {
      yield put({
        type: JMKX_LIST_SUMMURY_FAILED,
      });
    } else {
      yield put({
        type: JMKX_LIST_SUMMURY_SUCCESS,
        payload: data,
      });
    }
  } catch (e) {
    yield put({
      type: JMKX_LIST_SUMMURY_FAILED,
    });
  }
}

export function* watchQueryListSummury() {
  yield takeEvery(JMKX_LIST_SUMMURY_START, queryListSummury);
}
