/**
 */

import _ from 'lodash';
import { call, put, takeEvery } from 'redux-saga/effects';
import {
  REFRSH_LIST_DATA,
  REFRESH_STATUS,
  LIST_START,
  LIST_SUCESS,
  LIST_FAILED,
} from '../actions/lists';
import HttpRequest from '../services/httpRequest';

function* refrshList(action) {
  const screenKey = _.get(action, 'key');
  const status = _.get(action, 'status');
  let pageNo;

  if (status === REFRESH_STATUS) {
    pageNo = 1;
  } else {
    pageNo = action.payload.pageNo + 1;
  }

  if (pageNo <= action.pageCount || status === REFRESH_STATUS) {
    yield put({ type: LIST_START, status, screenKey });

    try {
      const data = yield call(HttpRequest.query, { ...action.payload, pageNo });
      if (!data) {
        yield put({ type: LIST_FAILED, status, screenKey });
      } else {
        yield put({ type: LIST_SUCESS, status, payload: data, screenKey });
      }
    } catch (e) {
      yield put({ type: LIST_FAILED, status, screenKey });
    }
  }
}

export function* watchRefrshList() {
  yield takeEvery(REFRSH_LIST_DATA, refrshList);
}
