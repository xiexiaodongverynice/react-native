/*
 * * 用于list列表数据存放
 */

const REFRSH_LIST_DATA = 'list/REFRSH_LIST_DATA';
const ONENDREACHED_LIST_DATA = 'list/ONENDREACHED_LIST_DATA';
const CLEAR_LIST_DATA = 'list/CLEAR_LIST_DATA';

const LIST_START = 'list/LIST_START';
const LIST_SUCESS = 'list/LIST_SUCESS';
const LIST_FAILED = 'list/LIST_FAILED';

const REFRESH_STATUS = 'list/REFRSH_STATUS';
const ONENDREACHED_STATUS = 'list/ONENDREACHED_STATUS';

const refrshList = (key) => ({ payload, status, pageCount }) => ({
  type: REFRSH_LIST_DATA,
  payload,
  status,
  pageCount,
  key,
});

const clearList = (key) => () => ({
  type: CLEAR_LIST_DATA,
  key,
});

export {
  CLEAR_LIST_DATA,
  ONENDREACHED_LIST_DATA,
  REFRSH_LIST_DATA,
  REFRESH_STATUS,
  ONENDREACHED_STATUS,
  LIST_START,
  LIST_SUCESS,
  LIST_FAILED,
  refrshList,
  clearList,
};
