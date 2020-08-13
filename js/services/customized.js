import config from '../utils/config';
import request from '../utils/request';
import { handleResult, handleResponse } from '../utils/handler';

const { api, baseURL } = config;
const { object_customer_action_summury } = api;

export default class CustomService {
  static async queryListSummury(payload) {
    const { recordType, objectApiName, productLine } = payload;
    let url = `${baseURL}${object_customer_action_summury}`.replace(/{\w+}/, objectApiName);
    if (recordType === 'hcp' && productLine === 'rx') {
      url = url.replace(/{\w+}/, `${objectApiName}_${productLine}`);
    } else {
      url = url.replace(/{\w+}/, objectApiName);
    }
    console.log('-------url------', url);
    const data = await request(url, 'POST', payload.payload);
    return handleResult(data);
  }
}
