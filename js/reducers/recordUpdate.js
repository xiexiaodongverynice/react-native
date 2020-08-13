/**
 *Created by Guanghua on 01/19;
 */
import _ from 'lodash';
import {
  RECORD_UPDATE_START,
  RECORD_UPDATE_SUCCESS,
  RECORD_UPDATE_FAILED,
} from '../actions/recordUpdate';
import { toastSuccess, toastWaring, toastError } from '../utils/toast';

const initState = {
  loading: true,
  error: false,
  status: 0,
};

export default function recordUpdateReducer(state = initState, action = {}) {
  if (action.type === RECORD_UPDATE_START) {
    return {
      ...state,
      status: 0,
      loading: true,
    };
  } else if (action.type === RECORD_UPDATE_SUCCESS) {
    return {
      ...state,
      status: 1,
      loading: false,
      error: null,
    };
  } else if (action.type === RECORD_UPDATE_FAILED) {
    return {
      ...state,
      status: 2,
      loading: false,
      error: true,
    };
  }
  return state;
}
