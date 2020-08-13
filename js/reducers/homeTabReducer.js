/*
 Created by Uncle Charlie, 2017/11/23
 */
import { CHANGE_HEADER_TAB, REPORT_TAB } from '../actions/headerTabAction';

const initialState = {
  tab: REPORT_TAB,
};

export default function homeTabReducer(state = initialState, action) {
  if (action.type == CHANGE_HEADER_TAB) {
    return { tab: action.tab };
  }
  return state;
}
