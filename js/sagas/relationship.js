/**
 * Create by Uncle Charlie, 29/12/2017
 * @flow
 */

import { call, put, takeEvery } from 'redux-saga/effects';
import {
  RELATIONSHIP_QUERY_DATA_FAILED,
  RELATIONSHIP_QUERY_DATA_LOAD_MORE_FAILED,
  RELATIONSHIP_QUERY_DATA_LOAD_MORE_START,
  RELATIONSHIP_QUERY_DATA_LOAD_MORE_SUCCESS,
  RELATIONSHIP_QUERY_DATA_START,
  RELATIONSHIP_QUERY_DATA_SUCCESS,
  RELATIONSHIP_QUERY_LAYOUT_FAILED,
  RELATIONSHIP_QUERY_LAYOUT_START,
  RELATIONSHIP_QUERY_LAYOUT_SUCCESS,
} from '../actions/relationship';
import HttpRequest from '../services/httpRequest';

function* queryRefreshData(action) {
  try {
    const data = yield call(HttpRequest.query, action.payload);

    if (!data) {
      yield put({ type: RELATIONSHIP_QUERY_DATA_FAILED });
    } else {
      yield put({ type: RELATIONSHIP_QUERY_DATA_SUCCESS, payload: data });
    }
  } catch (e) {
    console.log('===>saga relationship refresh error', e);
    yield put({ type: RELATIONSHIP_QUERY_DATA_FAILED });
  }
}

function* queryLoadMoreData(action) {
  try {
    const data = yield call(HttpRequest.query, action.payload);

    if (!data) {
      yield put({ type: RELATIONSHIP_QUERY_DATA_LOAD_MORE_FAILED });
    } else {
      yield put({
        type: RELATIONSHIP_QUERY_DATA_LOAD_MORE_SUCCESS,
        payload: data,
      });
    }
  } catch (e) {
    console.log('===>saga relationship refresh error', e);
    yield put({ type: RELATIONSHIP_QUERY_DATA_LOAD_MORE_FAILED });
  }
}

function* queryLayout(action) {
  try {
    const layout = yield call(HttpRequest.requestRelationLayout, action.payload);
    if (!layout) {
      yield put({ type: RELATIONSHIP_QUERY_LAYOUT_FAILED });
    } else {
      yield put({ type: RELATIONSHIP_QUERY_LAYOUT_SUCCESS, payload: layout });
    }
  } catch (e) {
    console.log('===>saga relationship layout error', e);
    yield put({ type: RELATIONSHIP_QUERY_LAYOUT_FAILED });
  }
}

export function* watchRefreshData() {
  yield takeEvery(RELATIONSHIP_QUERY_DATA_START, queryRefreshData);
}

export function* watchLoadMoreData() {
  yield takeEvery(RELATIONSHIP_QUERY_DATA_LOAD_MORE_START, queryLoadMoreData);
}

export function* watchLayout() {
  yield takeEvery(RELATIONSHIP_QUERY_LAYOUT_START, queryLayout);
}
