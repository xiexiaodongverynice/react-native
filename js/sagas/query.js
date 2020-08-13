/**
 * Created by Uncle Charlie, 2017/12/14
 */
import { DeviceEventEmitter } from 'react-native';
import { call, put, takeEvery } from 'redux-saga/effects';
import * as _ from 'lodash';
import {
  QUERY_DETAIL_FAILED,
  QUERY_DETAIL_START,
  QUERY_DETAIL_SUCCESS,
  QUERY_START,
  QUERY_FAILED,
  QUERY_SUCCESS,
  QUERY_LOAD_MORE_FAILED,
  QUERY_LOAD_MORE_START,
  QUERY_LOAD_MORE_SUCCESS,
  QUERY_MULTIPLE__LIST_FAILED,
  QUERY_MULTIPLE__LIST_START,
  QUERY_MULTIPLE__LIST_SUCCESS,
  QUERY_UPDATE_DATA_FAILED,
  QUERY_UPDATE_DATA_START,
  QUERY_UPDATE_DATA_SUCCESS,
  BUSEVENT_QUERY_UPDATE_DATA_SUCCESS,
} from '../actions/query';
import HttpRequest from '../services/httpRequest';
import recordService from '../services/recordService';
import IndexDataParser from '../services/dataParser';
import { SETTING_FIELD } from '../utils/const';
import * as Utils from '../utils/util';
import * as LocationHelper from '../tabs/common/helpers/locationHelper';

const DELETE_CASCADECREATE_KEY = [
  'owner',
  'owner__r',
  'create_by__r',
  'create_by',
  'update_by',
  'update_by__r',
  '_id',
];

const NEED_DELETE__R = ['newRecord', 'oldRecord', 'updateData'];

/**
 * TODO: query data with page num, size, and other parameters
 * @param action
 */
function* queryRecordList(action) {
  const {
    payload: { key, state },
  } = action;
  try {
    const data = yield call(HttpRequest.query, state);
    if (!data) {
      yield put({
        type: QUERY_FAILED,
        payload: {
          key,
        },
      });
    } else {
      yield put({
        type: QUERY_SUCCESS,
        payload: {
          key,
          state: data,
        },
      });
    }
  } catch (e) {
    console.log('===>query saga error', e);
    yield put({
      type: QUERY_FAILED,
      payload: {
        key,
      },
    });
  }
}

function* queryLoadMore(action) {
  const {
    payload: { key, state },
  } = action;
  try {
    const data = yield call(HttpRequest.query, state);
    if (!data) {
      yield put({
        type: QUERY_LOAD_MORE_FAILED,
        payload: {
          key,
        },
      });
    } else {
      yield put({
        type: QUERY_LOAD_MORE_SUCCESS,
        payload: {
          key,
          state: data,
        },
      });
    }
  } catch (e) {
    console.log('===>query saga error', e);
    yield put({
      type: QUERY_LOAD_MORE_FAILED,
      payload: {
        key,
      },
    });
  }
}

function* queryDetail(action) {
  const {
    payload: { key, state },
  } = action;
  try {
    const data = yield call(HttpRequest.queryDetail, state);
    if (!data) {
      yield put({
        type: QUERY_DETAIL_FAILED,
        payload: {
          key,
        },
      });
    } else {
      yield put({
        type: QUERY_DETAIL_SUCCESS,
        payload: {
          key,
          state: data,
        },
      });
    }
  } catch (e) {
    console.log('===>query detail saga, error', e);
    yield put({
      type: QUERY_DETAIL_FAILED,
      payload: {
        key,
      },
    });
  }
}

function* queryMultipleList(action) {
  const {
    payload: { key, state, headerLogs = {} },
  } = action;
  try {
    const data = yield call(recordService.queryMultipleRecordList, state, headerLogs);
    if (!data) {
      yield put({
        type: QUERY_MULTIPLE__LIST_FAILED,
        payload: {
          key,
        },
      });
    } else {
      yield put({
        type: QUERY_MULTIPLE__LIST_SUCCESS,
        payload: {
          key,
          state: data,
        },
      });
    }
  } catch (e) {
    console.error('error', e);
    yield put({
      type: QUERY_MULTIPLE__LIST_FAILED,
      payload: {
        key,
      },
    });
  }
}

function* updateDetail(action) {
  const {
    payload: { key, state },
  } = action;
  const {
    token,
    userId,
    objectApiName,
    updateData,
    oldRecord,
    newRecord,
    detailLayout,
    objectDescription,
    pageType = 'edit',
  } = state;
  console.log('【DCR】update detail ====>', action);

  try {
    //* 删除cascade中create默认设置属性 以及清除delete下面所有的update和create操作
    const composeData = deleteCascadeCorrelation(state, pageType, detailLayout);

    const tmpLocationParams = {
      newData: _.get(composeData, 'updateData', {}),
      cacheData: _.get(composeData, 'oldRecord', {}),
      relativeLocationField: _.get(detailLayout, SETTING_FIELD.RELATIVE_LOCATION_FIELD, 'customer'),
    };
    //* 根据当前经纬度获取偏差距离
    const tmpUpdateData = yield call(LocationHelper.insertLocationOffsetInfo, tmpLocationParams);
    composeData.updateData = tmpUpdateData;

    const data = yield call(HttpRequest.updateSingleRecord, composeData);
    if (!data) {
      yield put({
        type: QUERY_UPDATE_DATA_FAILED,
        payload: {
          key,
        },
      });
    } else {
      const mergedRecord = Object.assign({}, data, newRecord); // 因为DCR对象并不是立马生效，所以需要将old和new俩对象进行合并

      // 处理DCR内容
      saveDcr({
        userId,
        token,
        oldRecord,
        newRecord: mergedRecord,
        layout: detailLayout,
        objectApiName,
        objectDescription,
      });

      yield put({
        type: QUERY_UPDATE_DATA_SUCCESS,
        payload: {
          key,
          state: { data, objectApiName: state.objectApiName },
        },
      });

      //修改关联数据后，detail页面需要更新，detail页面监听此busevent。
      //传入两个参数action which induce this event，data returnd from server
      DeviceEventEmitter.emit(BUSEVENT_QUERY_UPDATE_DATA_SUCCESS, { action, data });

      const { callback } = action;
      if (_.isFunction(callback)) {
        callback(updateData, objectApiName);
      }
    }
  } catch (e) {
    console.log('===>upate detail error', e);
    yield put({
      type: QUERY_UPDATE_DATA_FAILED,
      payload: {
        key,
        state: e,
      },
    });
  }
}

function saveDcr(params) {
  const { userId, token, oldRecord, newRecord, layout, objectApiName, objectDescription } = params;
  const currentObjectDesc = IndexDataParser.getObjectDescByApiName(
    objectApiName,
    objectDescription,
  );
  const isDcrLayout = _.get(layout, 'is_dcr', false);
  const needDcr = _.has(oldRecord, 'id')
    ? global.DCR_EDIT_CUSTOMER_RULE === '0'
    : global.DCR_CREATE_CUSTOMER_RULE === '0';
  if (isDcrLayout && needDcr) {
    const dcrDetailList = [];
    const dcrData = {
      customer: _.get(newRecord, 'id'),
      parent_customer: _.get(newRecord, 'parent_id'),
      type: _.has(oldRecord, 'id', false) ? 2 : 1,
      status: 1,
    };

    const detailFormComponents = _.filter(_.get(layout, 'containers[0].components'), {
      type: 'detail_form',
    });
    let dcrFields = [];
    const objectFields = _.get(currentObjectDesc, 'fields');

    _.forEach(detailFormComponents, (detailFormComponent) => {
      const fieldSections = _.get(detailFormComponent, 'field_sections');
      _.forEach(fieldSections, (fieldSection) => {
        const fields = _.filter(_.get(fieldSection, 'fields'), { is_dcr: true });
        dcrFields = _.concat(dcrFields, fields);
      });
    });

    _.forEach(_.keys(newRecord), (fieldApiName) => {
      const dcrField = _.find(dcrFields, { field: fieldApiName });

      const oldData = _.get(oldRecord, fieldApiName);
      const newData = _.get(newRecord, fieldApiName);
      if (!_.isEmpty(dcrField) && !_.isEqual(oldData, newData)) {
        const fieldDescribe = _.find(objectFields, { api_name: fieldApiName });
        const mergedFieldDescribe = Object.assign({}, fieldDescribe, dcrField);
        const fieldName = _.get(fieldDescribe, 'label');
        const oldValue = IndexDataParser.getListValue(
          objectApiName,
          oldRecord,
          dcrField,
          mergedFieldDescribe,
        );
        const newValue = IndexDataParser.getListValue(
          objectApiName,
          newRecord,
          dcrField,
          mergedFieldDescribe,
        );
        const objToPush = {
          field_api_name: fieldApiName,
          field_name: fieldName,
          old_value: oldValue,
          new_value: newValue,
          old_data: oldData,
          new_data: newData,
          status: 1,
        };
        dcrDetailList.push(objToPush);
      }
    });
    const dcrBodyData = {
      ...dcrData,
      _cascade: {
        create: {
          dcr_dcr_detail_list: dcrDetailList,
        },
      },
    };
    if (!_.isEmpty(dcrDetailList)) {
      HttpRequest.updateSingleRecord({
        objectApiName: 'dcr',
        userId: '',
        token,
        updateData: dcrBodyData,
      });
    }
  }
}

function deleteCascadeCorrelation(state, pageType, detailLayout) {
  const mergeData = removeDcrData(_.cloneDeep(state), pageType, detailLayout);

  //* 去除多余 __r参数
  _.each(NEED_DELETE__R, (item) => {
    Utils.deleteObject__r(mergeData[item]);
  });

  if (pageType === 'add') {
    mergeData.newRecord = Utils.deleteObjectKey(mergeData.newRecord, ['create_by', 'owner']);
  }

  const newRecord = deleteCascadeCreateProperty(mergeData, 'newRecord');
  const updateData = deleteCascadeCreateProperty(mergeData, 'updateData');

  return {
    ...mergeData,
    newRecord,
    updateData,
  };
}

// * 优化cascade 去除多余的 __r 参数
// * 去除createList中的主动赋值参数 DELETE_CASCADECREATE_KEY
// * 2层级联操作时，补全跨层级联删除结构
function deleteCascadeCreateProperty(state, property) {
  const record = _.get(state, property, {});

  const cascadeCreate = _.get(record, '_cascade.create', {});
  const cascadeUpdate = _.get(record, '_cascade.update', {});
  const cascadeDelete = _.get(record, '_cascade.delete', {});

  if (_.isEmpty(cascadeCreate) && _.isEmpty(cascadeDelete)) return record;

  if (!_.isEmpty(cascadeCreate)) {
    const newCascadeCreate = cascadeCreate;
    _.each(newCascadeCreate, (item) => {
      _.each(item, (e) => {
        Utils.deleteObjectKey(e, DELETE_CASCADECREATE_KEY);
        Utils.deleteObject__r(e);
      });
    });

    // _.set(record, '_cascade.create', newCascadeCreate);
  }

  if (!_.isEmpty(cascadeDelete)) {
    const newCascadeDelete = cascadeDelete;

    _.each(newCascadeDelete, (item) => {
      _.each(item, (relateItem) => {
        Utils.deleteObject__r(relateItem);
        const deleteWrap = _.get(relateItem, '_cascade.delete', {});
        if (!_.isEmpty(deleteWrap)) {
          _.set(relateItem, '_cascade', {
            create: {},
            update: {},
            delete: deleteWrap,
          });
        }
      });
    });

    // _.set(record, '_cascade.delete', newCascadeDelete);
  }

  if (!_.isEmpty(cascadeUpdate)) {
    const newCascadeUpdate = cascadeUpdate;
    _.each(newCascadeUpdate, (item) => {
      _.each(item, (e) => {
        Utils.deleteObject__r(e);
      });
    });
  }

  return record;
}

//* 删除提交数据中dcr字段
function removeDcrData(data, pageType, detailLayout) {
  const isDcrLayout = _.get(detailLayout, 'is_dcr', false);
  const needDcr = pageType === 'edit' && global.DCR_EDIT_CUSTOMER_RULE === '0';
  if (!needDcr || !isDcrLayout) return data;

  const detailFormComponents = _.filter(_.get(detailLayout, 'containers[0].components'), {
    type: 'detail_form',
  });

  _.forEach(detailFormComponents, (detailFormComponent) => {
    const fieldSections = _.get(detailFormComponent, 'field_sections');
    _.forEach(fieldSections, (fieldSection) => {
      _.each(_.get(fieldSection, 'fields'), (item) => {
        const is_dcr = _.get(item, 'is_dcr');
        const field = _.get(item, 'field');
        if (!is_dcr) return;

        _.has(data, `newRecord.${field}`) && delete data.newRecord[field];
        _.has(data, `updateData.${field}`) && delete data.updateData[field];
      });
    });
  });

  return data;
}

export function* watchQuery() {
  yield takeEvery(QUERY_START, queryRecordList);
}

export function* watchQueryLoadMore() {
  yield takeEvery(QUERY_LOAD_MORE_START, queryLoadMore);
}

export function* watchQueryDetail() {
  yield takeEvery(QUERY_DETAIL_START, queryDetail);
}

export function* watchQueryMultipleList() {
  yield takeEvery(QUERY_MULTIPLE__LIST_START, queryMultipleList);
}

export function* watchUpdateDetail() {
  yield takeEvery(QUERY_UPDATE_DATA_START, updateDetail);
}
