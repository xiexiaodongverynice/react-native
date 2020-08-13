/**
 * @flow
 */

import _ from 'lodash';
import assert from './assert0';
import I18n from '../i18n';

type TypeRequestResult = { err: Error | null, response: Response | null, jsonResult: {} | null };

//request_insightFailreason和request的区别：insightFailreason将错误返回给caller，request将错误直接toast到屏幕
//返回值中 err是一个Error对象, response原样返回, jsonResult是一个plain js object。Error对象可以用toString打印
//caller需要先检查err，然后检查jsonResult。大部分情况不需要访问response
export default async function request_insightFailreason(
  url: string,
  method = 'GET',
  body = {},
  logs = {},
): TypeRequestResult {
  assert(_.isString(url), 'url must be string');
  assert(['POST', 'GET', 'DELETE', 'HEAD'].includes(method), 'method must be valid http keyword');
  assert(_.isObject(body), 'body must be object');
  assert(_.isObject(logs), 'logs must be object');

  global.tron.log(`request_insightFailreason(${url},${method}) body,logs:`, body, logs);

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

  try {
    const response = await fetch(url, init);
    if (!response.ok) {
      return { jsonResult: null, response, err: new Error('!response.ok') };
    }
    try {
      const jsonResult = await response.json();
      return { jsonResult, response, err: null }; //真的成功
    } catch (err) {
      //json deserialization过程中出错
      return { jsonResult: null, response, err };
    }
  } catch (err) {
    //fetch出错
    return { jsonResult: null, response: null, err: { message: I18n.t('network_connect_error') } };
  }
}
