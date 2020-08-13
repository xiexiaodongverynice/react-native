import _ from 'lodash';
import { QUERY_UPDATE_DATA_SUCCESS } from '../actions/query';
import { RECORD_UPDATE_SUCCESS } from '../actions/recordUpdate';
import { RECORD_DELETE_SUCCESS, RECORD_DELETE_START } from '../actions/recordDelete';
import {
  HOME_DATA_ADD_START,
  HOME_DATA_MODIFY_START,
  HOME_DATA_DELETE_START,
} from '../actions/newHome';
import I18n from '../i18n';
import { toastSuccess } from '../utils/toast';
import AStorage from '../utils/asStorage';
const query = (store) => (next) => (action) => {
  const { type, payload = {} } = action;
  const msg = _.get(payload, 'head.msg', I18n.t('action.operation_success'));
  // update success
  const { dispatch, getState } = store;
  const { state = {} } = payload;
  const { data = {}, objectApiName } = state;
  const allStore = getState();
  const { home = {} } = allStore;
  if (type === QUERY_UPDATE_DATA_SUCCESS) {
    toastSuccess(msg);
    AStorage.get('homeQueryConditions').then((res) => {
      if (res) {
        const { realCondition = [] } = res;
        _.each(realCondition, (condition) => {
          const queryApiName = _.get(condition, 'objectApiName', '');
          if (objectApiName === queryApiName) {
            const { criterias = [] } = condition;
            let is_have = true;
            _.each(criterias, (cri) => {
              const operator = _.get(cri, 'operator', '');
              const field = _.get(cri, 'field', '');
              const value = _.get(cri, 'value', '');
              if (operator === '>' && data[field] < value[0]) {
                is_have = false;
              } else if (operator === '<' && data[field] > value[0]) {
                is_have = false;
              } else {
                if (_.toString(value).indexOf(_.toString(data[field])) < -1) {
                  is_have = false;
                }
              }
            });

            if (is_have) {
              if (data['version'] === 0) {
                dispatch({
                  type: HOME_DATA_ADD_START,
                  payload: {
                    data,
                    objectApiName,
                  },
                });
              } else {
                dispatch({
                  type: HOME_DATA_MODIFY_START,
                  payload: {
                    data,
                    objectApiName,
                  },
                });
              }
            } else {
              const { listObjects = {} } = home;
              if (listObjects[objectApiName]) {
                _.each(listObjects[objectApiName], (item) => {
                  if (item && data && item.id === data.id) {
                    dispatch({
                      type: HOME_DATA_DELETE_START,
                      payload: {
                        data,
                        objectApiName,
                      },
                    });
                  }
                });
              }
            }
          }
        });
      }
    });
  }
  if (type === RECORD_DELETE_START) {
    // eslint-disable-next-line no-undef
    is_have = false;
    if (_.isEmpty(data)) {
      data['id'] = payload.id;
      data['object_describe_name'] = payload.objectApiName;
    }
    // let deleteApi = objectApiName ? objectApiName : payload.objectApiName;
    /**
     * HOME_DATA_DELETE_START saga 可能会因为参数不完整 400
     */
    //将RECORD_D_S转为HOME_DATA_D_S。有时候会undefined，这会导致app底部弹出toast "请求异常"。
    // 在这里进行判断，可以避免发送请求，也就不会弹出"请求异常"了。
    if (typeof objectApiName === 'string' && objectApiName.length) {
      dispatch({
        type: HOME_DATA_DELETE_START,
        payload: {
          data,
          objectApiName,
        },
      });
    }
  }
  if (type === RECORD_UPDATE_SUCCESS) {
    if (_.get(action, 'showAlert', true)) {
      toastSuccess(msg);
    }
  } else if (type === RECORD_DELETE_SUCCESS) {
    toastSuccess(msg);
  }
  next(action);
};

export default query;
