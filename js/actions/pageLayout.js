/*
 * Created by Uncle Charlie, 2017/12/12
 * @flow
 */

import UtilConstants from '../utils/constants';

const PAGE_LAYOUT_LOAD_START = 'layout/page/load_start';
const PAGE_LAYOUT_LOAD_FAILED = 'layout/page/load_failed';
const PAGE_LAYOUT_LOAD_SUCCESS = 'layout/page/load_success';
const PAGE_LAYOUT_SET_CACHE = 'layout/set_cache_layout';

export type LayoutAction = {
  type:
    | 'layout/page/load_start'
    | 'layout/page/load_failed'
    | 'layout/page/load_success'
    | 'layout/set_cache_layout',
  payload: any,
};

export default function requestLayout(
  recordType: string,
  objectApiName: string,
  layoutType: string,
  token: string,
) {
  return {
    type: PAGE_LAYOUT_LOAD_START,
    payload: {
      objectApiName,
      recordType,
      layoutType,
      token,
    },
  };
}

export function setCacheLayout(
  recordType: string,
  objectApiName: string,
  layoutType: string,
  layout: any,
) {
  return {
    type: PAGE_LAYOUT_SET_CACHE,
    payload: {
      [`${UtilConstants.getLayoutKey({ objectApiName, recordType, layoutType })}`]: layout,
    },
  };
}

export {
  PAGE_LAYOUT_LOAD_START,
  PAGE_LAYOUT_LOAD_FAILED,
  PAGE_LAYOUT_LOAD_SUCCESS,
  PAGE_LAYOUT_SET_CACHE,
};
