/*
 @flow
 */

//* 储存级联相关数据
const CASCADE_UPDATE_DATA = 'CASCADE_UPDATE_DATA';
const CASECADE_DELETE_DATA = 'CASCADE_DELETE_DATA';
const CASECADE_DELETE_ALL_DATA = 'CASECADE_DELETE_ALL_DATA';
const CASECADE_RETRACE_DATA = 'CASECADE_RETRACE_DATA';

//* 添加cascade空对象
const CASECADE_ADD_EMPTY = 'CASECADE_ADD_EMPTY';

// *储存级联相关数据索引及状态
const CASCADE_UPDATE_STATUS = 'CASCADE_UPDATE_STATUS';

export function cascadeUpdateData(payload: any) {
  return {
    type: CASCADE_UPDATE_DATA,
    payload,
  };
}

export function cascadeDeleteData(payload: any) {
  return {
    type: CASECADE_DELETE_DATA,
    payload,
  };
}

export function cascadeDeleteAllData() {
  return {
    type: CASECADE_DELETE_ALL_DATA,
  };
}

export function cascadeUpdateStatus(payload: any) {
  return {
    type: CASCADE_UPDATE_STATUS,
    payload,
  };
}

export function cascadeAddEmpty(payload: any) {
  return {
    type: CASECADE_ADD_EMPTY,
    payload,
  };
}

// * modal页面中未保存回退
export function cascadeRetrace(payload) {
  return {
    type: CASECADE_RETRACE_DATA,
    payload,
  };
}

export {
  CASCADE_UPDATE_DATA,
  CASECADE_ADD_EMPTY,
  CASECADE_RETRACE_DATA,
  CASECADE_DELETE_DATA,
  CASCADE_UPDATE_STATUS,
  CASECADE_DELETE_ALL_DATA,
};
