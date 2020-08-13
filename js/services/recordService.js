/**
 *Created by Guanghua on 12/21;
 *@flow
 */

import config from '../utils/config';
import request from '../utils/request';
import HttpRequest from './httpRequest';
import { handleResult, handleResponse } from '../utils/handler';

const { api, baseURL } = config;
const {
  record,
  record_query,
  record_detail,
  record_del,
  record_ubatch,
  multiple_query,
  update_notice,
} = api;

export default class RecordService {
  static async queryRecordListService(payload) {
    const url = `${baseURL}${record_query}`;
    const data = await request(url, 'POST', payload);
    return handleResult(data);
  }

  static async queryMultipleRecordList(payload, headerLogs = {}) {
    const url = `${baseURL}${multiple_query}`;
    const data = await request(url, 'POST', payload, headerLogs);
    return handleResult(data);
  }

  static async updateNotice(payload: any) {
    const url = `${baseURL}${update_notice}`;
    const data = await request(url, 'POST', payload);
    return handleResult(data);
  }

  static async loadRecord(payload: any) {
    const url = `${baseURL}${record_detail
      .replace('{api_name}', payload.object_api_name)
      .replace('{id}', payload.record_id)}`;
    const data = await request(url, 'POST', payload);
    return handleResult(data);
  }

  static async create(payload: any) {
    const url = `${baseURL}${record.replace('{api_name}', payload.object_api_name)}`;
    const data = await request(url, 'POST', payload.dealData);
    return handleResult(data);
  }

  static async batchCreate({
    objectApiName,
    token,
    data,
  }: {
    objectApiName: string,
    token: string,
    data: Array<any>,
  }) {
    const url = ``;
  }

  static async updateRecord(payload: any) {
    const path = record_detail
      .replace('{api_name}', payload.objectApiName || payload.object_api_name)
      .replace('{id}', payload.userId || payload.id);
    const url = `${baseURL}${path}`;
    const data = await request(url, 'PUT', payload.dealData);
    return handleResponse(data);
  }

  static async deleteRecord({
    token,
    objectApiName,
    id,
  }: {
    token: string,
    objectApiName: string,
    id: any,
  }) {
    const url = `${baseURL}${record_del
      .replace('{api_name}', objectApiName)
      .replace('{id}', id)}?token=${token}`;
    const data = await request(url, 'DELETE');
    return handleResponse(data);
  }

  static async batchUpdateRecords(payload: any) {
    const path = record_ubatch.replace('{api_name}', payload.object_api_name);
    const url = `${baseURL}${path}`;
    const data = await request(url, 'PUT', payload.dealData);
    return handleResponse(data);
  }
}
