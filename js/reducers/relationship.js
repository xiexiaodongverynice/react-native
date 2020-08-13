/**
 * Create by Uncle Charlie, 29/12/2017
 */

import {
  RELATIONSHIP_QUERY_DATA_FAILED,
  RELATIONSHIP_QUERY_DATA_LOAD_MORE_FAILED,
  RELATIONSHIP_QUERY_DATA_LOAD_MORE_START,
  RELATIONSHIP_QUERY_DATA_LOAD_MORE_SUCCESS,
  RELATIONSHIP_QUERY_DATA_START,
  RELATIONSHIP_QUERY_DATA_SUCCESS,
  RELATIONSHIP_QUERY_LAYOUT_FAILED,
  RELATIONSHIP_QUERY_LAYOUT_START,
  RELATIONSHIP_QUERY_LAYOUT_SUCCESS,
  RELATIONSHIP_SEARCH,
  RELATIONSHIP_SELECT_PARENT,
} from '../actions/relationship';

const initState = {
  refreshing: true, // data
  loadingMore: false, // data
  layoutLoading: false, // layout
  layout: null,
  data: null,
  layoutError: false,
  dataError: false,
  parent: null,
};

export default function(state = initState, action) {
  if (action.type === RELATIONSHIP_QUERY_DATA_START) {
    return {
      ...state,
      refreshing: true,
      loadingMore: false,
      dataError: false,
    };
  } else if (action.type === RELATIONSHIP_QUERY_DATA_FAILED) {
    return { ...state, refreshing: false, dataError: true };
  } else if (action.type === RELATIONSHIP_QUERY_DATA_SUCCESS) {
    return {
      ...state,
      refreshing: false,
      dataError: false,
      data: action.payload.result,
    };
  } else if (action.type === RELATIONSHIP_QUERY_DATA_LOAD_MORE_START) {
    return {
      ...state,
      refreshing: false,
      loadingMore: true,
      dataError: false,
    };
  } else if (action.type === RELATIONSHIP_QUERY_DATA_LOAD_MORE_FAILED) {
    return {
      ...state,
      refreshing: false,
      loadingMore: false,
      dataError: true,
    };
  } else if (action.type === RELATIONSHIP_QUERY_DATA_LOAD_MORE_SUCCESS) {
    return {
      ...state,
      refreshing: false,
      loadingMore: false,
      dataError: false,
      data: _.concat(state.data, action.payload.result),
    };
  } else if (action.type === RELATIONSHIP_QUERY_LAYOUT_START) {
    return { ...state, layout: null, layoutLoading: true };
  } else if (action.type === RELATIONSHIP_QUERY_LAYOUT_FAILED) {
    return {
      ...state,
      layoutError: true,
      layoutLoading: false,
      layout: null,
    };
  } else if (action.type === RELATIONSHIP_QUERY_LAYOUT_SUCCESS) {
    return {
      ...state,
      layoutError: false,
      layoutLoading: false,
      layout: action.payload,
    };
  } else if (action.type === RELATIONSHIP_SEARCH) {
    return {
      ...state,
      data: _.filter(state.data, (name) => _.includes(name, action.payload)),
    };
  } else if (action.type === RELATIONSHIP_SELECT_PARENT) {
    return {
      ...state,
      parent: action.payload,
    };
  }

  return state;
}
