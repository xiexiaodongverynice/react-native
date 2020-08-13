/**
 * Created by Uncle Charlie, 2017/12/14
 * @flow
 */

import _ from 'lodash';
import {
  QUERY_DETAIL_FAILED,
  QUERY_DETAIL_START,
  QUERY_DETAIL_SUCCESS,
  QUERY_FAILED,
  QUERY_LOAD_MORE_FAILED,
  QUERY_LOAD_MORE_START,
  QUERY_LOAD_MORE_SUCCESS,
  QUERY_MULTIPLE__LIST_FAILED,
  QUERY_MULTIPLE__LIST_START,
  QUERY_MULTIPLE__LIST_SUCCESS,
  QUERY_START,
  QUERY_SUCCESS,
  QUERY_UPDATE_DATA_FAILED,
  QUERY_UPDATE_DATA_START,
  QUERY_UPDATE_DATA_SUCCESS,
  UPDATE_DATA_RESET_STATE,
  CLEAR_DATA_STATE,
} from '../actions/query';

/**
 * 每一个单独的页面都有单独维护一个此类型的数据
 */
export const initScreenState = {
  updateLoading: false,
  loading: true,
  refreshing: true, // refreshing
  loadingMore: false, // Loading more
  detailLoading: true,
  error: false,
  updateError: false,
  detail: null,
  list: null,
  data: null,
  resultCount: null,
  apiName: '',
  updateData: null,
  updateSuccess: false,
};

/**
 * query类型页面数据集
 * <p>
 * {
 *  "id-1": {...initScreenState},
 *  "id-2": {...initScreenState},
 * }
 * </p>
 */
const initState = {};

/**
 *
 * @param {state} state
 * @param {key} key 命名空间，一般通过navigation获取key，唯一
 * @param {newState} newState
 */
const reAssignTargetStateByKey = (state, key, newState) => {
  const targetState = _.result(state, key, {});
  return {
    [key]: Object.assign({}, initScreenState, targetState, newState),
  };
};

/**
 * query reducer
 *
 * @param {*} state
 * @param {*} action
 *
 * action object like:
 * {
 *  key: 'id-1xx',
 *  state: {
 *
 *  }
 * }
 */
export default function queryReducer(state = initState, action = {}) {
  console.log(`%c --------state---------${action.type}`, 'font-size:20px;color:orange;');
  console.log(state);
  const payWhat = _.get(action, 'payload', {});
  const key = _.get(payWhat, 'key');
  const payload = _.get(payWhat, 'state');

  if (action.type === QUERY_SUCCESS) {
    return {
      ...state,
      ...reAssignTargetStateByKey(state, key, {
        list: _.get(payload, 'result', []),
        refreshing: false,
        error: false,
        resultCount: payload.resultCount,
      }),
    };
  } else if (action.type === QUERY_FAILED) {
    return {
      ...state,
      ...reAssignTargetStateByKey(state, key, {
        refreshing: false,
        error: true,
      }),
    };
  } else if (action.type === QUERY_START) {
    return {
      ...state,
      ...reAssignTargetStateByKey(state, key, {
        list: [],
        refreshing: true,
        loadingMore: false,
        error: false,
      }),
    };
  } else if (action.type === QUERY_LOAD_MORE_START) {
    return {
      ...state,
      ...reAssignTargetStateByKey(state, key, {
        refreshing: false,
        loadingMore: true,
        error: false,
      }),
    };
  } else if (action.type === QUERY_LOAD_MORE_FAILED) {
    return {
      ...state,
      ...reAssignTargetStateByKey(state, key, {
        loadingMore: false,
        error: true,
      }),
    };
  } else if (action.type === QUERY_LOAD_MORE_SUCCESS) {
    return {
      ...state,
      ...reAssignTargetStateByKey(state, key, {
        list: _.concat(_.get(state, `${key}.list`, []), _.get(payload, 'result')),
        loadingMore: false,
        error: false,
      }),
    };
  } else if (action.type === QUERY_DETAIL_START) {
    return {
      ...state,
      ...reAssignTargetStateByKey(state, key, {
        detailLoading: true,
      }),
    };
  } else if (action.type === QUERY_DETAIL_SUCCESS) {
    return {
      ...state,
      ...reAssignTargetStateByKey(state, key, {
        detail: _.get(payload, 'result', {}),
        detailLoading: false,
        error: false,
      }),
    };
  } else if (action.type === QUERY_DETAIL_FAILED) {
    return {
      ...state,
      ...reAssignTargetStateByKey(state, key, {
        detailLoading: false,
        error: _.get(payload, 'message', ''),
      }),
    };
  } else if (action.type === QUERY_MULTIPLE__LIST_START) {
    return {
      ...state,
      ...reAssignTargetStateByKey(state, key, {
        loading: true,
      }),
    };
  } else if (action.type === QUERY_MULTIPLE__LIST_SUCCESS) {
    return {
      ...state,
      ...reAssignTargetStateByKey(state, key, {
        data: payload,
        loading: false,
        error: null,
      }),
    };
  } else if (action.type === QUERY_MULTIPLE__LIST_FAILED) {
    return {
      ...state,
      ...reAssignTargetStateByKey(state, key, {
        data: null,
        loading: false,
        error: true,
      }),
    };
  } else if (action.type === QUERY_UPDATE_DATA_START) {
    const apiName = _.get(payload, 'objectApiName');
    return {
      ...state,
      ...reAssignTargetStateByKey(state, key, {
        apiName,
        updateLoading: true,
        updateError: null,
        updateSuccess: false,
      }),
    };
  } else if (action.type === QUERY_UPDATE_DATA_SUCCESS) {
    const apiName = _.get(payload, 'objectApiName');
    const updateData = _.get(payload, 'data');

    return {
      ...state,
      ...reAssignTargetStateByKey(state, key, {
        apiName,
        updateData,
        updateSuccess: true,
        updateLoading: false,
        updateError: null,
      }),
    };
  } else if (action.type === QUERY_UPDATE_DATA_FAILED) {
    const apiName = _.get(payload, 'objectApiName');
    return {
      ...state,
      ...reAssignTargetStateByKey(state, key, {
        apiName,
        updateLoading: false,
        updateError: true,
        updateSuccess: false,
      }),
    };
  } else if (action.type === UPDATE_DATA_RESET_STATE) {
    return {
      ...state,
      ...reAssignTargetStateByKey(state, key, {
        updateError: null,
        updateLoading: false,
        updateData: null,
        updateSuccess: false,
      }),
    };
  } else if (action.type === CLEAR_DATA_STATE) {
    return {
      ..._.omit(state, key),
    };
  }

  return state;
}
