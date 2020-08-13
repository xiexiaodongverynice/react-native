import _ from 'lodash';
import { call, put, takeEvery } from 'redux-saga/effects';
import {
  HOME_QUERY_START,
  HOME_QUERY_SUCCESS,
  HOME_QUERY_FAILED,
  HOME_DATA_ADD_START,
  HOME_DATA_ADD_SUCCESS,
  HOME_DATA_ADD_FAILED,
  HOME_DATA_DELETE_START,
  HOME_DATA_DELETE_SUCCESS,
  HOME_DATA_DELETE_FAILED,
  HOME_DATA_MODIFY_START,
  HOME_DATA_MODIFY_SUCCESS,
  HOME_DATA_MODIFY_FAILED,
  HOME_DATA_QUERY_START,
  HOME_DATA_QUERY_SUCCESS,
  HOME_DATA_QUERY_FAILED,
} from '../actions/newHome';
import recordService from '../services/recordService';
import HttpRequest from '../services/httpRequest';

function* queryHomeList(action) {
  try {
    const { payload, queryState, headerLogs = {}, callback = _.noop } = action;
    if (queryState) {
      yield put({
        type: HOME_QUERY_SUCCESS,
      });
    } else {
      const data = yield call(recordService.queryMultipleRecordList, payload.payload, headerLogs);
      callback();
      if (!data) {
        yield put({
          type: HOME_QUERY_FAILED,
        });
      } else {
        yield put({
          type: HOME_QUERY_SUCCESS,
          payload: data,
        });
      }
    }
  } catch (e) {
    yield put({
      type: HOME_QUERY_FAILED,
    });
  }
}

function* queryHomeSingleData(action) {
  try {
    const data = yield call(HttpRequest.queryDetail, action);
    if (!data) {
      yield put({
        type: HOME_DATA_QUERY_FAILED,
      });
    } else {
      yield put({
        type: HOME_DATA_QUERY_SUCCESS,
      });
    }
  } catch (err) {
    console.log('======> query home saga error', err);
    yield put({
      type: HOME_DATA_QUERY_FAILED,
    });
  }
}

function* homeDataModify(action) {
  try {
    const data = yield call(HttpRequest.updateSingleRecord, action);
    if (!data) {
      yield put({
        type: HOME_DATA_MODIFY_FAILED,
      });
    } else {
      yield put({
        type: HOME_DATA_MODIFY_SUCCESS,
      });
    }
  } catch (error) {
    console.log('======> query home saga error', error);
    yield put({
      type: HOME_DATA_MODIFY_FAILED,
    });
  }
}

function* homeDataAdd(action) {
  const { payload } = action;
  try {
    const { data, objectApiName } = payload;
    if (!data) {
      yield put({
        type: HOME_DATA_ADD_FAILED,
      });
    } else {
      yield put({
        type: HOME_DATA_ADD_SUCCESS,
        payload: {
          data,
          objectApiName,
        },
      });
    }
  } catch (error) {
    yield put({
      type: HOME_DATA_ADD_FAILED,
    });
  }
}

function* homeDataDelete(action) {
  try {
    const data = yield call(recordService.deleteRecord, action);
    if (!data) {
      yield put({
        type: HOME_DATA_DELETE_FAILED,
      });
    } else {
      yield put({
        type: HOME_DATA_DELETE_SUCCESS,
      });
    }
  } catch (error) {
    console.log('======> query home saga error', error);
    yield put({
      type: HOME_DATA_DELETE_FAILED,
    });
  }
}

export function* watchQueryHomeList() {
  yield takeEvery(HOME_QUERY_START, queryHomeList);
}

export function* watchQueryHomeSingleData() {
  yield takeEvery(HOME_DATA_QUERY_START, queryHomeSingleData);
}

export function* watchHomeDataModify() {
  yield takeEvery(HOME_DATA_MODIFY_START, homeDataModify);
}

export function* watchHomeDataAdd() {
  yield takeEvery(HOME_DATA_ADD_START, homeDataAdd);
}

export function* watchHomedataDelete() {
  yield takeEvery(HOME_DATA_DELETE_START, homeDataDelete);
}
