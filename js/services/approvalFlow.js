/**
 *@flow
 */

import config from '../utils/config';
import request from '../utils/request';
import { handleResult, handleResponse } from '../utils/handler';

const { api, baseURL } = config;
const { approval_flow } = api;

function addHeadToken(payload) {
  const body = {
    body: payload,
    head: {
      token: global.FC_CRM_TOKEN,
    },
  };
  return body;
}

export default class ApprovalFlowService {
  /**
   * @param payload{
   *  recordId number
   * }
   */
  static async getApprovalInfo(payload) {
    if (!_.get(payload, 'recordId')) {
      console.warn('[error service] getApprovalInfo is not found recordId ');
      return;
    }
    const url = `${baseURL}${approval_flow}/approval_nodes/${payload.recordId}?token=${global.FC_CRM_TOKEN}`;
    const data = await request(url, 'GET');
    return handleResult(data);
  }

  /**
   * @param payload{
   *  flow_api_name string
   *  record_api_name string
   *  record_id string
   * }
   */
  static async submitApproval(payload) {
    const url = `${baseURL}${approval_flow}/start/`;
    const boady = addHeadToken(payload);
    const data = await request(url, 'POST', boady);
    return handleResult(data);
  }

  /**
   * @param  payload{
   *  flow_id number
   *  comments string
   * }
   */
  static async cancelApproval(payload) {
    const url = `${baseURL}${approval_flow}/cancel/`;
    const boady = addHeadToken(payload);
    const data = await request(url, 'POST', boady);
    return handleResult(data);
  }

  /**
   * @param payload = {
   *   node_id :  long
   *   operation: string
   *   comments:  string
   * }
   */
  static async nodeOperation(payload) {
    const url = `${baseURL}${approval_flow}/operation/`;
    const boady = addHeadToken(payload);
    const data = await request(url, 'POST', boady);
    return handleResult(data);
  }
}
