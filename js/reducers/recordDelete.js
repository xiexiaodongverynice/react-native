/**
 *Created by Guanghua on 01/25;
 */
import _ from 'lodash';
import {
  RECORD_DELETE_START,
  RECORD_DELETE_SUCCESS,
  RECORD_DELETE_FAILED,
} from '../actions/recordUpdate';
import { toastSuccess, toastWaring, toastError } from '../utils/toast';

const initState = {
  loading: true,
  error: false,
  status: null, // 1: success 2: failed
};

export default function recordDeleteReducer(state = initState, action = {}) {
  if (action.type === RECORD_DELETE_START) {
    return {
      ...state,
      loading: true,
    };
  } else if (action.type === RECORD_DELETE_SUCCESS) {
    return {
      ...state,
      status: 1,
      loading: false,
      error: null,
    };
  } else if (action.type === RECORD_DELETE_FAILED) {
    return {
      ...state,
      status: 2,
      loading: false,
      error: true,
    };
  }
  return state;
}
