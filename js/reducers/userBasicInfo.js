/**
 * Create by Uncle Charlie, 2/1/2018
 * @flow
 */
import {
  USER_INFO_QUERY_FAILED,
  USER_INFO_QUERY_START,
  USER_INFO_QUERY_SUCCESS,
} from '../actions/userBasicInfo';

const initState = {
  loading: true,
  data: null,
  error: false,
};

export default function userInfo(state = initState, action = {}) {
  if (action.type === USER_INFO_QUERY_START) {
    return { ...state, data: null };
  } else if (action.type === USER_INFO_QUERY_SUCCESS) {
    return {
      ...state,
      data: action.payload,
      error: false,
      loading: false,
    };
  } else if (action.type === USER_INFO_QUERY_FAILED) {
    return { ...state, loading: false, error: true };
  }

  return state;
}
