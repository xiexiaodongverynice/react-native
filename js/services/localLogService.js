/**
 * * 本地日志
 */

import _ from 'lodash';
import Config from '../utils/config';
import { crmTenant_isjmkx } from '../utils/constants';
import request from '../utils/request';

export default class LocalLogService {
  static async postLogs(logs) {
    // if (!crmTenant_isjmkx()) return;

    const performance = Config.api.performance;

    const resultData = [];
    _.each(logs, (value, key) => {
      resultData.push(key);
    });
    const body = {
      head: { token: global.FC_CRM_TOKEN },
      body: {
        spans: resultData,
      },
    };
    console.log('body==>', body);
    const url = `${Config.baseURL}${performance}`;
    request(url, 'POST', body);
  }
}
