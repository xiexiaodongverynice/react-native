/**
 *Created by Guanghua on 01/15;
 */

import {
  QUERY_PRODUCT_START,
  QUERY_PRODUCT_FAILED,
  QUERY_PRODUCT_SUCCESS,
  QUERY_KEY_MESSAEG_START,
  QUERY_KEY_MESSAEG_FAILED,
  QUERY_KEY_MESSAEG_SUCCESS,
  QUERY_CLM_START,
  QUERY_CLM_SUCCESS,
  QUERY_CLM_FAILED,
} from '../actions/callReport';

const initState = {
  loading: true,
  error: false,
  product: null,
  keyMessage: null,
  clm: null,
};

export default function callReportReducer(state = initState, action = {}) {
  if (action.type === QUERY_PRODUCT_START) {
    return {
      ...state,
      loading: true,
    };
  } else if (action.type === QUERY_PRODUCT_SUCCESS) {
    return {
      ...state,
      product: action.payload,
      loading: false,
      error: null,
    };
  } else if (action.type === QUERY_PRODUCT_FAILED) {
    return {
      ...state,
      product: null,
      loading: false,
      error: true,
    };
  } else if (action.type === QUERY_CLM_START) {
    return {
      ...state,
      loading: true,
    };
  } else if (action.type === QUERY_CLM_SUCCESS) {
    return {
      ...state,
      clm: action.payload,
      loading: false,
      error: null,
    };
  } else if (action.type === QUERY_CLM_FAILED) {
    return {
      ...state,
      clm: null,
      loading: false,
      error: true,
    };
  } else if (action.type === QUERY_KEY_MESSAEG_START) {
    return {
      ...state,
      loading: true,
    };
  } else if (action.type === QUERY_KEY_MESSAEG_SUCCESS) {
    return {
      ...state,
      keyMessage: action.payload,
      loading: false,
      error: null,
    };
  } else if (action.type === QUERY_KEY_MESSAEG_FAILED) {
    return {
      ...state,
      keyMessage: null,
      loading: false,
      error: true,
    };
  }
  return state;
}
