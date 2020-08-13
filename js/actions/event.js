/**
 * @flow
 * Created by Uncle Charlie, 2018/03/07
 */

const ADD_EVENT_ATTENDEE_START = 'add_event_attendee_start';
const ADD_EVENT_ATTENDEE_SUCCESS = 'add_event_attendee_success';
const ADD_EVENT_ATTENDEE_FAILED = 'add_event_attendee_failed';

const ADD_EVENT_WALKIN_ATTENDEE_SUCCESS = 'add_event_walkin_attendee_success';

const EVENT_NEED_REFRESH_ATTENDEE = 'event/need_refresh_attendee_data';
const BUSEVENT_NEED_REFRESH_DETAIL = 'busevent/need_refresh_detail_data';

// BUSEVENT_NEED_REFRESH_DETAIL 如何完成刷新？
// 注意它不是redux的action！
// 假设当前有2个event页面，eventId分别是111和222
// 每个页面都要订阅这个事件（DeviceEventEmitter.addListener），修改参与人、且提交给后端成功后sagas emit这个事件（见sagas/events.js yield call(HttpRequest.batchCreate, action.payload)），
// emit时要发送eventId
// listener中根据eventId决定是否更新当前页面。如eventId是111，两个页面都会收到事件，但仅111页面更新

export function addAttendee({
  objectApiName,
  token,
  data,
  eventId,
}: {
  objectApiName: string,
  token: string,
  data: Array<any>,
  eventId: string,
}) {
  return {
    type: ADD_EVENT_ATTENDEE_START,
    payload: {
      objectApiName,
      token,
      data,
      eventId,
    },
  };
}

export function needRefreshAttendee(
  needRefresh: boolean = false,
  refreshApiName: string,
  eventId: string,
) {
  return {
    type: EVENT_NEED_REFRESH_ATTENDEE,
    payload: {
      needRefresh,
      refreshApiName,
      eventId,
    },
  };
}

export function addWalkinAttendeeSuccess(apiName: string, success: boolean = false) {
  return {
    type: ADD_EVENT_WALKIN_ATTENDEE_SUCCESS,
    payload: {
      apiName,
      success,
    },
  };
}

export {
  ADD_EVENT_ATTENDEE_START,
  ADD_EVENT_ATTENDEE_SUCCESS,
  ADD_EVENT_ATTENDEE_FAILED,
  ADD_EVENT_WALKIN_ATTENDEE_SUCCESS,
  EVENT_NEED_REFRESH_ATTENDEE,
  BUSEVENT_NEED_REFRESH_DETAIL,
};
