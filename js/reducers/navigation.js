/*
  Created by Uncle Charlie, 2017/11/22
 */

// TODO: this may be deprecated!

import _ from 'lodash';
import {
  NAVIGATION_PUSH_SUCCESS,
  NAVIGATION_PUSH_FAILED,
  NAVIGATION_PUSH_START,
  NAVIGATION_UPDATE_START,
  NAVIGATION_UPDATE_SUCCESS,
  NAVIGATION_UPDATE_FAILED,
  NAVIGATION_DELETE_FAILED,
  NAVIGATION_DELETE_START,
  NAVIGATION_DELETE_SUCCESS,
} from '../actions/navigation';

const initState = {
  screenInfos: [],
};

export default function navigationReducer(state = initState, action = {}) {
  switch (action.type) {
    case NAVIGATION_PUSH_SUCCESS:
      state.screenInfos.splice(state.screenInfos.length, 0, action.payload.screenInfo);
      return state;
    case NAVIGATION_UPDATE_SUCCESS:
      const last = _.last(state.screenInfos);
      if (last) {
        /**
         * 更新最后一个screen页面的标签页信息
         */
        const tabs = last.tabs || [];
        const tab = action.payload.screenInfo.tab;
        const existIndex = _.findIndex(tabs, {
          index: tab.index,
        });
        if (existIndex === -1) {
          tabs.push(tab);
        } else {
          tabs.splice(existIndex, 1, tab);
        }
        state.screenInfos.splice(
          state.screenInfos.length - 1,
          1,
          Object.assign({}, last, {
            tabs,
          }),
        );
      }
      return state;
    case NAVIGATION_DELETE_SUCCESS:
      const last_ = _.last(state.screenInfos);
      if (last_) {
        if (last_.key === action.payload.key) {
          state.screenInfos.splice(state.screenInfos.length - 1, 1);
        }
      }
      return state;
    case NAVIGATION_DELETE_FAILED:
    case NAVIGATION_PUSH_FAILED:
    case NAVIGATION_UPDATE_FAILED:
    default:
      return state;
  }
}
