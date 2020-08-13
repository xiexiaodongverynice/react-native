/**
 * Created by Uncle Charlie, 2017/12/12
 * @flow
 */

import { call, put, takeEvery } from 'redux-saga/effects';
import {
  PAGE_LAYOUT_LOAD_FAILED,
  PAGE_LAYOUT_LOAD_START,
  PAGE_LAYOUT_LOAD_SUCCESS,
} from '../actions/pageLayout';
import HttpRequest from '../services/httpRequest';
import type { Saga } from 'redux-saga';

function* fetchPageLayout(action): Saga<void> {
  try {
    const layout = yield call(HttpRequest.requestPageLayout, action.payload);
    if (!layout) {
      yield put({ type: PAGE_LAYOUT_LOAD_FAILED });
    } else {
      yield put({ type: PAGE_LAYOUT_LOAD_SUCCESS, payload: layout });
    }
  } catch (e) {
    yield put({ type: PAGE_LAYOUT_LOAD_FAILED });
  }
}

export default function* watchPageLayout(): Saga<void> {
  yield takeEvery(PAGE_LAYOUT_LOAD_START, fetchPageLayout);
}
