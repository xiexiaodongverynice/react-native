/**
 *Created by yjgao 2018-07-06;
 *@flow
 */

import config from '../utils/config';
import request from '../utils/request';

const { api, baseURL } = config;
const { templateCopy, templateApply } = api;

export default class TemplateService {
  static async templateCopy(id, payload: any) {
    const url = `${baseURL}${templateCopy.replace('{id}', id)}`;
    const data = await request(url, 'POST', payload);
    return data;
  }

  static async templateApply(id, payload: any) {
    const url = `${baseURL}${templateApply.replace('{id}', id)}`;
    const data = await request(url, 'POST', payload);
    return data;
  }
}
