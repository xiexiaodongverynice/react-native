/**
 * * 设备更新接口查询
 * @flow
 */

import _ from 'lodash';
import moment from 'moment';
import Globals from '../utils/Globals';
import { app_version, api, ssoURL, app_key } from '../utils/config';
import { handleResult } from '../utils/handler';
import HttpRequest from './httpRequest';
import request from '../utils/request';
import themes from '../tabs/common/theme';

const HOT_RELOAD = 'https://www.easy-mock.com/mock/590ab0487a878d73716ec685/example/hotreload2';
const APP_RELOAD = 'https://www.easy-mock.com/mock/590ab0487a878d73716ec685/example/update1';

export default class UpdateVersionService {
  static async getVersionInfo() {
    try {
      const body = {
        version: app_version,
        device_type: themes.platform === 'ios' ? 'iOS' : 'Android',
        app_key,
      };
      const url = `${ssoURL}${api.hotReload_status}`;
      const resultData = await request(url, 'POST', body);
      // const resultData = await request(APP_RELOAD, 'POST', body);
      const versionInfo: versionInfoType = handleResult(resultData);
      if (!versionInfo || _.isEmpty(versionInfo)) return {};
      return versionInfo;
    } catch (e) {
      return {};
    }
  }
}
