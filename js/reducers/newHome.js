/**
 * create at 2018-11-05
 */

import _ from 'lodash';
import {
  HOME_QUERY_START,
  HOME_QUERY_SUCCESS,
  HOME_QUERY_FAILED,
  HOME_DATA_ADD_START,
  HOME_DATA_ADD_SUCCESS,
  HOME_DATA_ADD_FAILED,
  HOME_DATA_MODIFY_START,
  HOME_DATA_MODIFY_SUCCESS,
  HOME_DATA_MODIFY_FAILED,
  HOME_DATA_QUERY_START,
  HOME_DATA_QUERY_SUCCESS,
  HOME_DATA_QUERY_FAILED,
  HOME_DATA_DELETE_START,
  HOME_DATA_DELETE_SUCCESS,
  HOME_DATA_DELETE_FAILED,
  CACHE_COMPUTED_HOME_DATA,
} from '../actions/newHome';

const initState = {
  listObjects: {},
  computedHomeData: [],
  type: 'homeReducer',
};

export default function homeReducer(state = initState, action = {}) {
  const { listObjects = {}, type } = state; //重新查询的时候，listobjects会清空，所以在请求这边无用。
  const { payload = {} } = action;
  const { data = {}, objectApiName } = payload;
  switch (action.type) {
    case HOME_QUERY_START:
      return {
        ...state,
        loading: true,
        success: 0,
      };
    case HOME_QUERY_SUCCESS:
      const { batch_result = [] } = payload;
      const objectDataList = {};
      _.each(batch_result, (query) => {
        const result = _.get(query, 'result', '');
        const resultCount = _.get(query, 'resultCount', 0);
        if (resultCount > 0) {
          _.each(result, (rst) => {
            const api_name = _.get(rst, 'object_describe_name', '');
            if (api_name) {
              if (objectDataList[api_name]) {
                objectDataList[api_name].push(rst);
              } else {
                objectDataList[api_name] = [];
                objectDataList[api_name].push(rst);
              }
            }
          });
        }
      });
      const newlistObjects = Object.assign({}, objectDataList);

      const newState = {
        listObjects: newlistObjects,
        type,
      };
      return {
        ...newState,
        loading: false,
        success: 1,
      };
    case HOME_QUERY_FAILED:
      return {
        ...state,
        loading: false,
        success: 2,
      };
    case HOME_DATA_ADD_START:
      const beforeAddLists = Object.assign({}, listObjects);
      if (!beforeAddLists[objectApiName]) {
        beforeAddLists[objectApiName] = [];
        beforeAddLists[objectApiName].push(data);
      } else {
        beforeAddLists[objectApiName].push(data);
      }
      const newADDState = {
        listObjects: beforeAddLists,
        type,
      };
      return {
        ...newADDState,
        loading: true,
        success: 0,
      };
    case HOME_DATA_ADD_SUCCESS:
      return {
        ...state,
        loading: false,
        success: 1,
      };
    case HOME_DATA_ADD_FAILED:
      return {
        ...state,
        loading: false,
        success: 2,
      };
    case HOME_DATA_MODIFY_START:
      const beforeModifyLists = Object.assign({}, listObjects);
      if (!beforeModifyLists[objectApiName]) {
        beforeModifyLists[objectApiName].push(data);
      } else {
        let is_have = false;
        _.each(beforeModifyLists[objectApiName], (item) => {
          if (data && item && item.id === data.id) {
            is_have = true;
            beforeModifyLists[objectApiName].splice(
              beforeModifyLists[objectApiName].indexOf(item),
              1,
            );
            beforeModifyLists[objectApiName].push(data);
          }
        });
        if (!is_have) {
          beforeModifyLists[objectApiName].push(data);
        }
      }
      const newModifyState = {
        listObjects: beforeModifyLists,
        type,
      };
      return {
        ...newModifyState,
        loading: true,
        success: 0,
      };
    case HOME_DATA_MODIFY_SUCCESS:
      return {
        ...state,
        loading: false,
        success: 1,
      };
    case HOME_DATA_MODIFY_FAILED:
      return {
        ...state,
        loading: false,
        success: 2,
      };
    case HOME_DATA_QUERY_START:
      return {
        ...state,
        loading: true,
        success: 0,
      };
    case HOME_DATA_QUERY_SUCCESS:
      return {
        ...state,
        loading: false,
        success: 1,
      };
    case HOME_DATA_QUERY_FAILED:
      return {
        ...state,
        loading: false,
        success: 2,
      };
    case HOME_DATA_DELETE_START:
      console.log('dsdsd =======>dadadadas', data, objectApiName, listObjects);
      let compareApiName = objectApiName;
      if (!objectApiName) {
        compareApiName = data['object_describe_name'];
      }
      const beforeDeleteLists = Object.assign({}, listObjects);
      console.log(beforeDeleteLists, compareApiName, beforeDeleteLists[compareApiName]);
      if (beforeDeleteLists[compareApiName]) {
        console.log('item ========>', beforeDeleteLists[compareApiName]);
        _.each(beforeDeleteLists[compareApiName], (item, index) => {
          if (item && data && item.id === data.id) {
            beforeDeleteLists[compareApiName].splice(index, 1);
          }
        });
      }
      console.log('delete after =======>', beforeDeleteLists);
      return {
        ...state,
        listObjects: beforeDeleteLists,
        loading: true,
        success: 0,
      };
    case HOME_DATA_DELETE_SUCCESS:
      return {
        ...state,
        loading: false,
        success: 1,
      };
    case HOME_DATA_DELETE_FAILED:
      return {
        ...state,
        loading: false,
        success: 2,
      };
    case CACHE_COMPUTED_HOME_DATA:
      return {
        ...state,
        computedHomeData: payload.data,
      };
    default:
      return {
        ...state,
        loading: false,
        success: 2,
      };
  }
}
