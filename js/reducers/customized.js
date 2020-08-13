// 2018-11-28 by gao

import {
  JMKX_LIST_SUMMURY_FAILED,
  JMKX_LIST_SUMMURY_START,
  JMKX_LIST_SUMMURY_SUCCESS,
  JMKX_LIST_SUMMURY_CLEAN,
} from '../actions/customized';

const initialState = {
  result: [],
};

export default function jmkxIndexSummury(state = initialState, action = {}) {
  if (action.type === JMKX_LIST_SUMMURY_START) {
    return {
      ...state,
      loding: true,
    };
  } else if (action.type === JMKX_LIST_SUMMURY_SUCCESS) {
    const {
      payload: { result },
    } = action;
    const newState = Object.assign({}, ...state);
    newState.result = result;
    newState.loding = false;
    return newState;
  } else if (action.type === JMKX_LIST_SUMMURY_FAILED) {
    return {
      ...state,
      needRefresh: true,
    };
  } else if (action.type === JMKX_LIST_SUMMURY_CLEAN) {
    return {
      result: [],
      loding: false,
    };
  }
  return state;
}
