/**
 * Create by Uncle Charlie, 2/1/2018
 * @flow
 */
import { takeEvery, call, put } from 'redux-saga/effects';
import { INNER_QUERY_FAILED, INNER_QUERY_START, INNER_QUERY_SUCCESS } from '../actions/innerQuery';
import HttpRequest from '../services/httpRequest';

function* queryInnerDetail(action) {
  try {
    const data = yield call(HttpRequest.queryInnerDetail, action.payload);
    if (!data) {
      yield put({ type: INNER_QUERY_FAILED });
    } else {
      yield put({ type: INNER_QUERY_SUCCESS, payload: data });
    }
  } catch (e) {
    yield put({ type: INNER_QUERY_FAILED });
  }
}

export default function* watchInnerQuery() {
  yield takeEvery(INNER_QUERY_START, queryInnerDetail);
}
