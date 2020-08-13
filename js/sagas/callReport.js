/**
 *Created by Guanghua on 01/15;
 */

import { call, put, takeEvery } from 'redux-saga/effects';
import {
  QUERY_PRODUCT_START,
  QUERY_PRODUCT_FAILED,
  QUERY_PRODUCT_SUCCESS,
  QUERY_KEY_MESSAEG_START,
  QUERY_KEY_MESSAEG_FAILED,
  QUERY_KEY_MESSAEG_SUCCESS,
  QUERY_CLM_START,
  QUERY_CLM_SUCCESS,
  QUERY_CLM_FAILED,
} from '../actions/callReport';
import HttpRequest from '../services/httpRequest';
import recordService from '../services/recordService';

function* queryProduct(action) {
  try {
    const data = yield call(recordService.queryRecordListService, action.payload);
    if (!data) {
      yield put({ type: QUERY_PRODUCT_FAILED });
    } else {
      yield put({ type: QUERY_PRODUCT_SUCCESS, payload: data });
    }
  } catch (e) {
    yield put({ type: QUERY_PRODUCT_FAILED });
  }
}

function* queryKeyMessage(action) {
  try {
    const data = yield call(recordService.queryRecordListService, action.payload);
    if (!data) {
      yield put({ type: QUERY_KEY_MESSAEG_FAILED });
    } else {
      yield put({ type: QUERY_KEY_MESSAEG_SUCCESS, payload: data });
    }
  } catch (e) {
    yield put({ type: QUERY_KEY_MESSAEG_FAILED });
  }
}

function* queryClm(action) {
  try {
    const data = yield call(recordService.queryRecordListService, action.payload);
    if (!data) {
      yield put({ type: QUERY_CLM_FAILED });
    } else {
      yield put({ type: QUERY_CLM_SUCCESS, payload: data });
    }
  } catch (e) {
    yield put({ type: QUERY_CLM_FAILED });
  }
}

export function* watchQueryProduct() {
  yield takeEvery(QUERY_PRODUCT_START, queryProduct);
}

export function* watchQueryKeyMessage() {
  yield takeEvery(QUERY_KEY_MESSAEG_START, queryKeyMessage);
}

export function* watchQueryClm() {
  yield takeEvery(QUERY_CLM_START, queryClm);
}
