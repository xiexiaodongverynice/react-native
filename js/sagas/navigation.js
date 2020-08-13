import { call, put, takeEvery, select } from 'redux-saga/effects';
import _ from 'lodash';
import {
  NAVIGATION_PUSH_FAILED,
  NAVIGATION_PUSH_SUCCESS,
  NAVIGATION_PUSH_START,
  NAVIGATION_LOAD_FAILED,
  NAVIGATION_LOAD_SUCCESS,
  NAVIGATION_LOAD_START,
  NAVIGATION_UPDATE_START,
  NAVIGATION_UPDATE_FAILED,
  NAVIGATION_UPDATE_SUCCESS,
  NAVIGATION_DELETE_START,
  NAVIGATION_DELETE_SUCCESS,
} from '../actions/navigation';

function* pushNavigationHistory(action) {
  yield put({ type: NAVIGATION_PUSH_SUCCESS, payload: action.payload });
}

function* loadNavigationHistory(action) {
  const screenInfos = yield select((state) => state.navigation.screenInfos);
  const { callback } = action;
  if (_.isFunction(callback)) {
    callback(screenInfos);
  }
}

function* updateNavigationHistory(action) {
  yield put({ type: NAVIGATION_UPDATE_SUCCESS, payload: action.payload });
}

function* deleteNavigationHistory(action) {
  yield put({ type: NAVIGATION_DELETE_SUCCESS, payload: action.payload });
}

export default function* watchNavigation() {
  yield takeEvery(NAVIGATION_PUSH_START, pushNavigationHistory);
}

export function* watchNavigationLoadHistory() {
  yield takeEvery(NAVIGATION_LOAD_START, loadNavigationHistory);
}

export function* watchNavigationUpdateHistory() {
  yield takeEvery(NAVIGATION_UPDATE_START, updateNavigationHistory);
}

export function* watchNavigationDeleteHistory() {
  yield takeEvery(NAVIGATION_DELETE_START, deleteNavigationHistory);
}
