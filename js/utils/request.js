/**
 * Created by Uncle Charlie, 2017/12/06
 * @flow
 */

import _ from 'lodash';
import { toastError } from './toast';
import I18n from '../i18n';

export default function request(url: string, method: string = 'GET', body: Object = {}, logs = {}) {
  global.tron.log(`request(${url},${method}) body,logs:`, body, logs);
  if (url.includes('stg-tm.crmpower.cn/rest/metadata/layout/event/detail_page/version')) {
    // debugger;
  }
  const init = {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Accept-language': 'zh-CN',
      ...logs,
    },
  };

  if (method !== 'GET') {
    init.body = JSON.stringify(body);
  }

  console.log(`%c start fetch: ${url}`, 'color: green;font-size: 14px;font-weight:bold;');

  console.log(init);

  return fetch(url, init)
    .then(checkStatus)
    .then((response) => {
      const result = response.json();
      console.log(`%c fetch end: ${url}`, 'color: green;font-size: 14px;font-weight:bold;', result);

      return result;
    })
    .catch((err) => {
      // Fetch 基于 XHR 接口开发，只会在 XHR 的 onerror, ontimeout, onabort, 对一个 response 二次读取, 以 ArrayBuffer 读取 Blob (使用 FileReader) 发生异常时 reject。
      toastError(err.isStatusCodeError ? err.message : I18n.t('network_connect_error'));
    });
}

function checkStatus(response) {
  if (!response.ok) {
    // eslint-disable-next-line prefer-promise-reject-errors
    return Promise.reject({
      isStatusCodeError: true,
      message: response.statusText || I18n.t('request_error'),
    });
  }
  return response;
}

/**
 * @param {Object} formObj
 * 采用序列化数组的形式在表单中传递数组
 */
export function genFormData(formObj: Object = {}) {
  const formData = new FormData();
  _.each(formObj, (value, key) => {
    formData.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
  });
  return formData;
}
