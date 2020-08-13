/**
 * Create by Uncle Charlie, 2/1/2018
 * @flow
 */
import { INNER_QUERY_FAILED, INNER_QUERY_START, INNER_QUERY_SUCCESS } from '../actions/innerQuery';

const initState = {
  loading: true,
  error: false,
  data: {},
  queryKey: null,
};

export default function innerReducer(state = initState, action = {}) {
  if (action.type === INNER_QUERY_START) {
    if (state.data[action.payload.innerType]) {
      state.data[action.payload.innerType] = null;
    }

    return {
      ...state,
      queryKey: '',
      loading: true,
      error: false,
    };
  } else if (action.type === INNER_QUERY_SUCCESS) {
    state.data[action.payload.innerType] = action.payload.data.result;
    return {
      ...state,
      queryKey: action.payload.innerType,
      loading: false,
      error: false,
    };
  } else if (action.type === INNER_QUERY_FAILED) {
    return {
      queryKey: action.payload ? action.payload.innerType : '',
      ...state,
      loading: false,
      error: true,
    };
  }

  return state;
}
