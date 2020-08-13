/**
 * @flow
 */

import _ from 'lodash';
import config, { baseURL } from '../utils/config';
import request from '../utils/request';
import { handleResult, handleResponse } from '../utils/handler';
import { toastSuccess, toastError } from '../utils/toast';

const { api } = config;
const { custom_action } = api;

export default class CustomActionService {
  /**
   * * customAction通用接口
   *
   * @static
   * @param {*} payload{ objectApiName, actionLayout, ids = [], parseParams = {}}
   * @returns
   * @memberof CustomActionService
   */
  static async post(payload) {
    const { objectApiName, actionLayout, ids = [], parseParams = {} } = payload;

    // if (_.isEmpty(ids)) {
    //   console.error('ids is empty');
    //   return;
    // }

    const describe = global.fc_getObjectDescribe(objectApiName);

    const { actions } = describe;

    const actionDef = actions[actionLayout.action];
    if (!actionDef) {
      toastError('未定义的Action' + actionLayout.action);
      return;
    }
    const result = await CustomActionService.executeAction({
      objectApiName,
      ids,
      action: actionLayout.action,
      params: Object.assign({}, actionDef.params, actionLayout.params, parseParams),
    });

    return handleResult(result);
  }

  /**
   * payload = {
   *   objectApiName String,
   *   action String,
   *   ids array,
   *   params object
   * }
   * @param payload
   * @returns {*}
   */
  static async executeAction(payload) {
    const { objectApiName, action, ids, params = {} } = payload;
    const url = `${baseURL}${custom_action}${objectApiName}/${action}`;
    return request(url, 'post', {
      body: {
        ids,
        params,
      },
      head: {
        token: global.FC_CRM_TOKEN,
      },
    });
  }

  static async resolveAction(payload) {
    const result = await CustomActionService.executeAction(payload);
    return handleResult(result);
  }

  /**
   *
   * * customAction service
   * * 支持show_modal
   * * https://jira.forceclouds.com/browse/CRM-6004
   * @static
   * @param {*} { selecteds, customOnsuccessCallback, actionLayout,parseParams }
   * @returns
   * @memberof DetailService
   */
  static async postCustomeShowModal({
    selecteds,
    customOnsuccessCallback,
    parseParams,
    actionLayout,
  }) {
    const ids = _.chain(selecteds)
      .filter((perSelected) => _.has(perSelected, 'id'))
      .map((perSelected) => perSelected.id)
      .value();

    if (_.isEmpty(ids)) return;

    const cutomActionName = _.get(actionLayout, 'action');
    const objectApiName = _.get(actionLayout, 'object_describe_api_name');
    const payload = {
      objectApiName,
      action: cutomActionName,
      ids,
      params: parseParams,
    };

    const response = await CustomActionService.resolveAction(payload);

    customOnsuccessCallback(response);
  }
}
