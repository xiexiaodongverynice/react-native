import _ from 'lodash';
import {
  CANCEL_APPROVAL,
  GET_APPROVAL,
  SUBMIT_APPROVAL,
  NODE_OPERATION,
  SUCCESS_APPROVAL,
  FAIL_APPROVAL,
} from '../actions/approvalFlow';
import { reAssignTargetStateByKey } from './helper';

const initState = {
  key: 0,
  approval_nodes: [],
  approval_flow: [],
  success: 0, // 0: default, 1: success, 2: fail
};

export default function approvalFlowReducer(state = {}, action = {}) {
  if (action.type === SUCCESS_APPROVAL) {
    const key = _.get(action, 'key');
    return {
      ...state,
      ...reAssignTargetStateByKey(state, key, action.payload, initState),
    };
  } else if (action.type === FAIL_APPROVAL) {
    const key = _.get(action, 'key');
    const status = _.get(action, 'status');
    return {
      ...state,
      ...reAssignTargetStateByKey(state, key, { status }, initState),
    };
  }
  return state;
}
