import _ from 'lodash';
import { reAssignTargetStateByKey } from './helper';
import {
  LIST_START,
  LIST_SUCESS,
  LIST_FAILED,
  ONENDREACHED_STATUS,
  REFRESH_STATUS,
  CLEAR_LIST_DATA,
} from '../actions/lists';

const initState = {
  loading: false,
  loadingMore: false,
  result: [],
  resultCount: 0,
  pageNo: 1,
};

export default function listReducer(state = {}, action = {}) {
  const status = _.get(action, 'status');
  const screenKey = _.get(action, 'screenKey');
  //* 调用列表刷新，更新列表显示状态
  if (action.type === LIST_START) {
    const oldData = _.get(state, `${screenKey}`, {});
    if (status === REFRESH_STATUS) {
      return {
        ...state,
        ...reAssignTargetStateByKey(state, screenKey, {
          ...oldData,
          loading: true,
          loadingMore: false,
        }),
      };
    } else if (status === ONENDREACHED_STATUS) {
      return {
        ...state,
        ...reAssignTargetStateByKey(state, screenKey, {
          ...oldData,
          loading: false,
          loadingMore: true,
        }),
      };
    }
  } else if (action.type === LIST_SUCESS) {
    if (status === REFRESH_STATUS) {
      const newState = {
        loading: false,
        loadingMore: false,
        result: _.get(action, 'payload.result', []),
        resultCount: _.get(action, 'payload.resultCount', 0),
        pageNo: _.get(action, 'payload.pageNo', 0),
        pageCount: _.get(action, 'payload.pageCount', 0),
      };
      return {
        ...state,
        ...reAssignTargetStateByKey(state, screenKey, newState),
      };
    } else if (status === ONENDREACHED_STATUS) {
      const oldResult = _.get(state, `${screenKey}.result`, []);
      const newResult = _.get(action, 'payload.result', []);
      const newState = {
        loading: false,
        loadingMore: false,
        result: _.concat(oldResult, newResult),
        resultCount: _.get(action, 'payload.resultCount', 0),
        pageNo: _.get(action, 'payload.pageNo', 0),
        pageCount: _.get(action, 'payload.pageCount', 0),
      };
      return {
        ...state,
        ...reAssignTargetStateByKey(state, screenKey, newState),
      };
    }
  } else if (action.type === LIST_FAILED) {
    const oldData = _.get(state, `${screenKey}`, {});
    return {
      ...state,
      ...reAssignTargetStateByKey(state, screenKey, {
        ...oldData,
        loading: false,
        loadingMore: false,
      }),
    };
  } else if (action.type === CLEAR_LIST_DATA) {
    const key = _.get(action, 'key');
    delete state[key];
    return {
      ...state,
    };
  }
  return state;
}
