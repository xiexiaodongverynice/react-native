// create at 2018-11-05

const HOME_QUERY_START = 'home/start_query';
const HOME_QUERY_SUCCESS = 'home/query_success';
const HOME_QUERY_FAILED = 'home/query_failed';

const HOME_DATA_MODIFY_START = 'home/data_modify_start';
const HOME_DATA_MODIFY_SUCCESS = 'home/data_modify_success';
const HOME_DATA_MODIFY_FAILED = 'home/data_modify_failed';

const HOME_DATA_DELETE_START = 'home/data_delete_start';
const HOME_DATA_DELETE_SUCCESS = 'home/data_delete_success';
const HOME_DATA_DELETE_FAILED = 'home/data_delete_failed';

const HOME_DATA_ADD_START = 'home/data_add_start';
const HOME_DATA_ADD_SUCCESS = 'home/data_add_success';
const HOME_DATA_ADD_FAILED = 'home/data_add_failed';

const HOME_DATA_QUERY_START = 'home/data_query_start';
const HOME_DATA_QUERY_SUCCESS = 'home/data_query_success';
const HOME_DATA_QUERY_FAILED = 'home/data_query_failed';

const CACHE_COMPUTED_HOME_DATA = 'home/cache_computed_home_data';

export function queryHomeList(condition) {
  const { payload, queryState } = condition;
  if (queryState) {
    return {
      type: HOME_QUERY_SUCCESS,
      payload,
    };
  }
  return {
    type: HOME_QUERY_START,
    payload,
  };
}

export function queryHomeSingleData(condition) {
  return {
    type: HOME_DATA_QUERY_START,
    payload: condition,
  };
}

export function homeDataModify(newData) {
  return {
    type: HOME_DATA_MODIFY_START,
    payload: newData,
  };
}

export function homeDataAdd(newData) {
  return {
    type: HOME_DATA_ADD_START,
    payload: newData,
  };
}

export function homeDataDelete(condition) {
  return {
    type: HOME_DATA_DELETE_START,
    payload: condition,
  };
}

/**
 * 缓存首页已经计算好的新的首页数据，以便其他地方同步使用。
 * @param {Array} data
 */
export function cacheComputedData(data) {
  return {
    type: CACHE_COMPUTED_HOME_DATA,
    payload: {
      data,
    },
  };
}

export {
  HOME_QUERY_START,
  HOME_QUERY_SUCCESS,
  HOME_QUERY_FAILED,
  HOME_DATA_ADD_START,
  HOME_DATA_ADD_FAILED,
  HOME_DATA_ADD_SUCCESS,
  HOME_DATA_DELETE_START,
  HOME_DATA_DELETE_SUCCESS,
  HOME_DATA_DELETE_FAILED,
  HOME_DATA_MODIFY_START,
  HOME_DATA_MODIFY_SUCCESS,
  HOME_DATA_MODIFY_FAILED,
  HOME_DATA_QUERY_START,
  HOME_DATA_QUERY_SUCCESS,
  HOME_DATA_QUERY_FAILED,
  CACHE_COMPUTED_HOME_DATA,
};
