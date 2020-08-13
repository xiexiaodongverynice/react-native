/**
 * *拜访计划
 * @flow
 */

import _ from 'lodash';
import HttpRequest from './httpRequest';
import CustomActionService from './customActionService';
import { api, baseURL } from '../utils/config';
import { toastError } from '../utils/toast';

const { call_record_type_config } = api;

export default class CallPlanService {
  /**
   *
   * * 根据拜访路线获取路线关联客户
   * @static
   * @param {*} ids
   * @returns
   * @memberof CallPlanService
   */
  static async getCallPlanPathCustomer(ids) {
    const params = {
      token: global.FC_CRM_TOKEN,
      objectApiName: 'call_path_customer',
      criteria: [
        {
          field: 'call_path',
          operator: 'in',
          value: ids,
        },
      ],
      joiner: 'and',
      orderBy: 'create_time',
      order: 'asc',
      pageSize: 1000,
      pageNo: 1,
    };
    const dataResult = await HttpRequest.query(params);
    return dataResult;
  }

  /**
   *
   * * 拜访计划中
   * 获取添加路线的customer 对应的 record_type
   * @static
   * @returns
   * @memberof CallPlanService
   */
  static async getCallPathRecordType() {
    const homeConfigUrl = baseURL + call_record_type_config.replace('query', global.FC_CRM_TOKEN);
    const result = await HttpRequest.basicGetQuery(homeConfigUrl);
    const value = _.get(result, 'value', JSON.stringify({}));
    return JSON.parse(_.toString(value));
  }

  /**
   *
   * * 检查客户并获取客户数据
   * @static
   * @param {*} customerIds
   * @returns
   * @memberof CallPlanService
   */
  static async checkCustomerDatas(customerIds) {
    try {
      const [data, status] = await Promise.all([
        CallPlanService.getCustomerDatas(customerIds),
        CallPlanService.checkCustomer(customerIds),
      ]);

      return _.get(data, 'result', []);
    } catch (e) {
      console.error('checkCustomerDatas error', e);
      return [];
    }
  }

  /**
   *
   * * 添加拜访路线时获取customer对象数据
   * @static
   * @param {*} customerIds
   * @returns
   * @memberof CallPlanService
   */
  static async getCustomerDatas(customerIds) {
    const params = {
      token: global.FC_CRM_TOKEN,
      objectApiName: 'customer',
      criteria: [
        {
          field: 'id',
          operator: 'in',
          value: customerIds,
        },
      ],
      joiner: 'and',
      orderBy: 'create_time',
      order: 'asc',
      pageSize: 1000,
      pageNo: 1,
    };
    const dataResult = await HttpRequest.query(params);
    return dataResult;
  }

  /**
   *
   * * customer action 检查添加的拜访路线的客户是否正确
   * @static
   * @param {*} customerIds
   * @memberof CallPlanService
   */
  static async checkCustomer(customerIds) {
    const params = {
      objectApiName: 'customer',
      action: 'add_call_path',
      ids: customerIds,
      token: global.FC_CRM_TOKEN,
    };

    const res = await CustomActionService.executeAction(params);
    const resCode = _.get(res, 'head.code');
    const resMsg = _.get(res, 'head.msg');
    if (resCode !== 200) {
      toastError(resMsg);
      throw Error('[CallPlanService checkCustomer error]');
    }
  }
}
