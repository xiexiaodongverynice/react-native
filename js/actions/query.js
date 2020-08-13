/**
 * Created by Uncle Charlie, 2017/12/14
 * @flow
 */

export const QUERY_START = 'query/query_data_start';
export const QUERY_SUCCESS = 'query/query_data_success';
export const QUERY_FAILED = 'query/query_data_failed';

export const QUERY_LOAD_MORE_START = 'query/query_data_load_more_start';
export const QUERY_LOAD_MORE_SUCCESS = 'query/query_data_load_more_success';
export const QUERY_LOAD_MORE_FAILED = 'query/query_data_load_more_failed';

export const QUERY_DETAIL_START = 'query/query_detail_data_start';
export const QUERY_DETAIL_SUCCESS = 'query/query_detail_data_success';
export const QUERY_DETAIL_FAILED = 'query/query_detail_data_failed';

export const QUERY_MULTIPLE__LIST_START = 'query/query_multiple_list_start';
export const QUERY_MULTIPLE__LIST_SUCCESS = 'query/query_multiple_list_success';
export const QUERY_MULTIPLE__LIST_FAILED = 'query/query_multiple_list_failed';

export const QUERY_UPDATE_DATA_START = 'query/upate_detail_data_start';
export const QUERY_UPDATE_DATA_SUCCESS = 'query/upate_detail_data_success';
export const QUERY_UPDATE_DATA_FAILED = 'query/update_detail_data_failed';

//BUSEVENT和redux没关系，并不会导致redux的state被修改，所有的修改由listener执行
export const BUSEVENT_QUERY_UPDATE_DATA_SUCCESS = 'BUSEVENT_QUERY_UPDATE_DATA_SUCCESS';

export const UPDATE_DATA_RESET_STATE = 'query/update_detail_reset_state';

export const CLEAR_DATA_STATE = 'query/clear_data_state';

export function queryRecordListAction(key) {
  return function(
    token: string,
    opValue: string,
    objectApiName: string,
    criteria: Array<any>,
    orderBy: string,
    order: string,
    pageSize: number,
    pageNo: number,
  ) {
    return {
      type: QUERY_START,
      payload: {
        key,
        state: {
          token,
          opValue,
          objectApiName,
          criteria,
          orderBy,
          order,
          pageSize,
          pageNo,
        },
      },
    };
  };
}

export function queryLoadMoreAction(key) {
  return function(
    token: string,
    opValue: string,
    objectApiName: string,
    criteria: Array<any>,
    orderBy: string,
    order: string,
    pageSize: number,
    pageNo: number,
  ) {
    return {
      type: QUERY_LOAD_MORE_START,
      payload: {
        key,
        state: {
          token,
          opValue,
          objectApiName,
          criteria,
          orderBy,
          order,
          pageSize,
          pageNo,
        },
      },
    };
  };
}

export function queryDetail(key) {
  return function(
    token: string,
    userId: string,
    criteria: Array<{ field: string, operator: string, value: string[] }>,
    objectApiName: string,
    order: string,
    orderBy: string,
  ): { type: string, payload: any } {
    return {
      type: QUERY_DETAIL_START,
      payload: {
        key,
        state: {
          token,
          userId,
          criteria,
          objectApiName,
          order,
          orderBy,
        },
      },
    };
  };
}

export function queryMultipleRecordList(key) {
  return function(payload, headerLogs = {}) {
    return {
      type: QUERY_MULTIPLE__LIST_START,
      payload: {
        key,
        state: payload,
        headerLogs,
      },
    };
  };
}

/**
 * Update detail data action
 * @returns {{type: string, payload: {token: string, userId: string, objectApiName: string}}}
 */
export function updateDetail(key) {
  return function(
    token: string,
    targetUserId: string,
    objectApiName: string,
    data: any,
    oldRecord: any,
    newRecord: any,
    detailLayout: any,
    objectDescription: any,
    callback: Function,
    pageType: string = 'edit',
  ): { type: string, payload: any } {
    return {
      callback,
      type: QUERY_UPDATE_DATA_START,
      payload: {
        key,
        state: {
          token,
          userId: targetUserId,
          objectApiName,
          updateData: data,
          oldRecord,
          newRecord,
          detailLayout,
          objectDescription,
          pageType,
        },
      },
    };
  };
}

export function resetUpdateState(key) {
  return function() {
    return {
      type: UPDATE_DATA_RESET_STATE,
      payload: {
        key,
      },
    };
  };
}

export function createCriteria(field: string, operator: string, value: [string]) {
  return {
    field,
    operator,
    value,
  };
}

export function clearQuery(key) {
  return function() {
    return {
      type: CLEAR_DATA_STATE,
      payload: {
        key,
      },
    };
  };
}
