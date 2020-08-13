/**
 * *本地日志管理
 */

import _ from 'lodash';
import uuidBuilder from '../lib/uuidBuilder';
import LocalLogService from '../services/localLogService';

const LOCAL_LOGS_SIZE = 10;

export default class LocalLog {
  static logs = new Map();

  /**
   *
   * * 本地监控
   * @static
   * @returns
   * @memberof LocalLog
   */
  static storageBegin() {
    const uuid = uuidBuilder();
    const processBegin = Date.now();
    return {
      uuid,
      processBegin,
      storageEnd: ({ layoutApiName, objectApiName }) => {
        const processEnd = Date.now();
        const mapKey = `${uuid}-${objectApiName}-${layoutApiName}-${processBegin}-${processEnd}`;
        const mapValue = processEnd - processBegin;
        LocalLog.logStage(mapKey, mapValue);
      },
    };
  }

  /**
   *
   * * 储存本地log
   * @static
   * @param {*} key
   * @param {*} value
   * @returns
   * @memberof LocalLog
   */
  static logStage(key, value) {
    LocalLog.logs.set(key, value);
    const size = LocalLog.logs.size;

    if (size < LOCAL_LOGS_SIZE) return;

    const resultObj = Object.create(null);
    for (const [k, v] of LocalLog.logs) {
      resultObj[k] = v;
    }
    LocalLog.logs.clear();
    // LocalLogService.postLogs(resultObj);
  }

  /**
   *
   * * 拼接 header 参数对象
   * @static
   * @param {*} { uuid, objectApiName, processBegin }
   * @returns
   * @memberof LocalLog
   */
  static jointLogParams({ uuid, objectApiName, processBegin }) {
    const value = `${uuid}-${objectApiName}-null-${processBegin}`;
    const headerDes = { 'fc-token': value };
    return headerDes;
  }
}
