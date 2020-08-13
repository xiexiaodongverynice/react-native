/**
 * Created by Uncle Charlie, 2017/12/06
 */

import { call, put, takeEvery } from 'redux-saga/effects';
import {
  CANCEL_APPROVAL,
  NODE_OPERATION,
  SUBMIT_APPROVAL,
  SUCCESS_APPROVAL,
  FAIL_APPROVAL,
  GET_APPROVAL,
} from '../actions/approvalFlow';
import ApprovalFlowService from '../services/approvalFlow';
import InitState from '../reducers/state';

function* getApproval(action) {
  const key = _.get(action, 'key');
  try {
    const data = yield call(ApprovalFlowService.getApprovalInfo, action.payload);
    if (!data) {
      yield put({ type: FAIL_APPROVAL, status: 2, key });
    } else {
      yield put({ type: SUCCESS_APPROVAL, status: 0, payload: data, key });
    }
  } catch (e) {
    yield put({ type: FAIL_APPROVAL, status: 1, key });
  }
}

function* submitApproval(action) {
  const { callback } = action;
  try {
    const data = yield call(ApprovalFlowService.submitApproval, action.payload);
    if (data) {
      callback();
    } else {
      callback('err submitApproval');
    }
  } catch (e) {
    callback(e);
    console.log('err submitApproval', e);
  }
}

function* cancelApproval(action) {
  const { callback } = action;
  const key = _.get(action, 'key');
  try {
    const data = yield call(ApprovalFlowService.cancelApproval, action.payload);
    if (data) {
      callback();
      yield put({ type: SUCCESS_APPROVAL, status: 0, payload: InitState.approvalFlow, key });
    } else {
      callback('err cancelApproval');
    }
  } catch (e) {
    callback(e);
    console.log('err cancelApproval', e);
  }
}

function* nodeOperation(action) {
  const { callback } = action;
  const key = _.get(action, 'key');
  try {
    const data = yield call(ApprovalFlowService.nodeOperation, action.payload);
    if (data) {
      callback();
      // yield put({ type: SUCCESS_APPROVAL, status: 0, payload: InitState.approvalFlow, key });
    } else {
      callback('err nodeOperation');
    }
  } catch (e) {
    callback(e);
    console.log('err nodeOperation', e);
  }
}

export function* watchGetApproval() {
  yield takeEvery(GET_APPROVAL, getApproval);
}

export function* watchSubmitApproval() {
  yield takeEvery(SUBMIT_APPROVAL, submitApproval);
}

export function* watchCancelApproval() {
  yield takeEvery(CANCEL_APPROVAL, cancelApproval);
}

export function* watchNodeOperation() {
  yield takeEvery(NODE_OPERATION, nodeOperation);
}
