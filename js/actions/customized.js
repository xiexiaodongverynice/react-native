// 2018-11-28 by gao

/**济民可信 */
const JMKX_LIST_SUMMURY_START = 'jmkx/list_summury_start';
const JMKX_LIST_SUMMURY_SUCCESS = 'jmkx/list_summury_success';
const JMKX_LIST_SUMMURY_FAILED = 'jmkx/list_summury_failed';
const JMKX_LIST_SUMMURY_CLEAN = 'jmkx/list_summury_clean';

export function jmkxListSummury(condition) {
  return {
    type: JMKX_LIST_SUMMURY_START,
    payload: condition,
  };
}
export function jmkxListSummuryClean(condition) {
  return {
    type: JMKX_LIST_SUMMURY_CLEAN,
    payload: condition,
  };
}

export {
  JMKX_LIST_SUMMURY_START,
  JMKX_LIST_SUMMURY_SUCCESS,
  JMKX_LIST_SUMMURY_FAILED,
  JMKX_LIST_SUMMURY_CLEAN,
};
