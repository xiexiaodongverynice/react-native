/**
 * Created by Uncle Charlie, 2018/03/07
 */

import {
  ADD_EVENT_ATTENDEE_START,
  ADD_EVENT_ATTENDEE_SUCCESS,
  ADD_EVENT_ATTENDEE_FAILED,
  ADD_EVENT_WALKIN_ATTENDEE_SUCCESS,
  EVENT_NEED_REFRESH_ATTENDEE,
} from '../actions/event';

const initialState = {
  addAttendeeLoading: false,
  addAttendeeError: false,
  addAttendeeResult: null,
  addWalkinAttendeeSuccess: false,
  needRefresh: false, //历史问题，实际应该叫needRefreshAttendee，EVENT_NEED_REFRESH_ATTENDEE会导致此变量修改
  refreshApiName: null,
};

export default function eventReducer(state = initialState, action = {}) {
  if (action.type === ADD_EVENT_ATTENDEE_START) {
    return {
      ...state,
      addAttendeeError: null,
      addAttendeeLoading: true,
      addAttendeeResult: null,
    };
  } else if (action.type === ADD_EVENT_ATTENDEE_SUCCESS) {
    return {
      ...state,
      addAttendeeLoading: false,
      addAttendeeError: null,
      addAttendeeResult: action.payload,
    };
  } else if (action.type === ADD_EVENT_ATTENDEE_FAILED) {
    return {
      ...state,
      addAttendeeResult: null,
      addAttendeeError: action.error,
      addAttendeeLoading: false,
    };
  } else if (action.type === ADD_EVENT_WALKIN_ATTENDEE_SUCCESS) {
    const { apiName, success } = action.payload;
    return {
      ...state,
      apiName,
      addWalkinAttendeeSuccess: success,
    };
  } else if (action.type === EVENT_NEED_REFRESH_ATTENDEE) {
    return {
      ...state,
      ...action.payload,
    };
  }

  return state;
}
