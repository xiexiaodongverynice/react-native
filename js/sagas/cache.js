/**
 * Created by Uncle Charlie, 2017/12/06
 */
import { call, put, takeEvery } from 'redux-saga/effects';
import {
  SETTINGS_CACHE_LOAD_FAILED,
  SETTINGS_CACHE_LOAD_START,
  SETTINGS_CACHE_LOAD_SUCCESS,
} from '../actions/cache';
import CacheService from '../services/cache';
import { LOGIN_CACHE_KEYS } from '../utils/constants';
import HelpGlobal from '../utils/helpers/helpGlobal';

function* loadSettingsCache(action) {
  try {
    const data = yield call(CacheService.laodMultCache, LOGIN_CACHE_KEYS);
    if (isCacheValid(data)) {
      yield call(HelpGlobal.setGlobalHelper, data[1]);

      yield put({ type: SETTINGS_CACHE_LOAD_SUCCESS, payload: { data } });
    } else {
      yield put({ type: SETTINGS_CACHE_LOAD_FAILED });
    }
  } catch (e) {
    console.warn('===>saga cache error', e);
    yield put({ type: SETTINGS_CACHE_LOAD_FAILED, payload: { message: e.message } });
  }
}

export default function* watchCache() {
  yield takeEvery(SETTINGS_CACHE_LOAD_START, loadSettingsCache);
}

function isCacheValid(data) {
  const [error, cache] = data;
  if (error) {
    return false;
  }

  if (!cache || !cache.permission || !cache.token || !cache.tabs) {
    return false;
  }

  return true;
}
