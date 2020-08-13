/**
 * Created by Uncle Charlie, 2017/12/12
 * @flow
 */

import {
  PAGE_DETAIL_LOAD_FAILED,
  PAGE_DETAIL_LOAD_START,
  PAGE_DETAIL_LOAD_SUCCESS,
  PAGE_LAYOUT_LOAD_FAILED,
  PAGE_LAYOUT_LOAD_SUCCESS,
  PAGE_LAYOUT_SET_CACHE,
} from '../actions/pageLayout';
import type { LayoutAction } from '../actions/pageLayout';

const initState = {
  loading: true,
  indexLayout: null,
  detailLayout: null,
  detailLoading: true,
  error: false,
};

export default function layoutReducer(state: any = initState, action: LayoutAction) {
  if (action.type === PAGE_LAYOUT_LOAD_SUCCESS) {
    return {
      ...state,
      loading: false,
      ...action.payload,
    };
  } else if (action.type === PAGE_LAYOUT_LOAD_FAILED) {
    return {
      loading: false,
      indexLayout: null,
      detailLayout: null,
    };
  } else if (action.type === PAGE_LAYOUT_SET_CACHE) {
    return {
      ...state,
      ...action.payload,
    };
  }

  return state;
}
