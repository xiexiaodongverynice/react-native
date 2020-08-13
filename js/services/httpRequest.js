/**
 * Created by Uncle Charlie, 2017/12/12
 * @flow
 */
import _ from 'lodash';
import request from '../utils/request';
import Config from '../utils/config';
import { handleResult } from '../utils/handler';
import UserService from '../services/userService';

export type DetailReturnType = {
  result: ?any,
};

/**
 * TODO: move all http request in services layer here.
 */
export default class HttpRequest {
  static async batchCreate({
    objectApiName,
    token,
    data,
  }: {
    objectApiName: string,
    token: string,
    data: Array<any>,
  }) {
    const url = `${Config.baseURL}${Config.api.multiple_record}${objectApiName}`;
    const method = 'POST';

    const requestBody = {
      head: {
        token,
      },
      body: {
        data,
      },
    };
    const result = await request(url, method, requestBody);
    return handleResult(result);
  }

  static async requestPageLayoutVersion({
    recordType,
    objectApiName,
    layoutType,
    token,
    headerLogs = {},
  }: {
    recordType: string,
    objectApiName: string,
    layoutType: string,
    token: string,
  }) {
    const param = {
      recordType,
      token,
    };
    const url = `${Config.baseURL}${
      Config.api.layout
    }${objectApiName}/${layoutType}/version${HttpRequest.objectToQueryString(param)}`;
    const result = await request(url, 'GET', {}, headerLogs);
    return handleResult(result);
  }

  static async requestPageLayout({
    recordType,
    objectApiName,
    layoutType,
    token,
    headerLogs,
  }: {
    recordType: string,
    objectApiName: string,
    layoutType: string,
    token: string,
    headerLogs: object,
  }) {
    const param = {
      recordType,
      token,
    };
    const url = `${Config.baseURL}${
      Config.api.layout
    }${objectApiName}/${layoutType}${HttpRequest.objectToQueryString(param)}`;
    const result = await request(url, 'GET', {}, headerLogs);
    return handleResult(result);
  }

  static async requestRelationLayout({
    objectApiName,
    layoutType,
    token,
    recordType,
  }: {
    objectApiName: string,
    layoutType: string,
    token: string,
    recordType: string,
  }) {
    const param = {
      recordType,
      token,
    };
    const url = `${Config.baseURL}${
      Config.api.layout
    }${objectApiName}/${layoutType}${HttpRequest.objectToQueryString(param)}`;
    console.log(`===>relation layout ${url}`);
    const result = await request(url);
    return handleResult(result);
  }

  static async requestCalenderLayout({ token }: { token: string }) {
    const url = `${Config.baseURL}${Config.api.calendar_setting}?token=${token}`;
    const layout = await request(url);

    return layout.body;
  }

  /**
   * Query data mainly by `object_api_name`, `token` and `operation value`.
   */
  static async query({
    token,
    objectApiName,
    criteria,
    territoryCriterias = [],
    joiner,
    orderBy,
    order,
    pageSize,
    pageNo,
    approvalCriterias = {},
    headerLogs = {},
  }: {
    token: string,
    objectApiName: string,
    criteria: Array<any>,
    territoryCriterias?: Array<any>,
    joiner: string,
    orderBy: string,
    order: string,
    pageSize: number,
    pageNo: number,
    approvalCriterias?: object,
    headerLogs?: object,
  }) {
    const url = `${Config.baseURL}${Config.api.record_query}`;
    let requestBody = '';
    if (_.isEmpty(approvalCriterias)) {
      requestBody = generateQueryHeader(
        token,
        objectApiName,
        criteria,
        territoryCriterias,
        _.isEmpty(joiner) ? 'and' : joiner,
        orderBy,
        order,
        pageSize,
        pageNo,
      );
    } else {
      requestBody = generateQueryHeader(
        token,
        objectApiName,
        criteria,
        territoryCriterias,
        _.isEmpty(joiner) ? 'and' : joiner,
        orderBy,
        order,
        pageSize,
        pageNo,
        { approvalCriterias },
      );
    }

    console.log(`http request url ${url}`, requestBody);
    const data = await request(url, 'POST', requestBody, headerLogs);
    return handleResult(data);
  }

  static async queryDetail({
    token,
    criteria,
    objectApiName,
  }: {
    token: string,
    criteria: Array<any>,
    userId: string,
    objectApiName: string,
  }): Promise<?DetailReturnType> | ?DetailReturnType {
    const queryUrl = `${Config.baseURL}${Config.api.record_query}`;
    const requestBody = generateDetailHeader(token, criteria, objectApiName);
    console.log(`===>http query detail url ${queryUrl}`, requestBody);

    const data = await request(queryUrl, 'POST', requestBody);
    console.log('===>http query detail', data);
    return handleResult(data);
  }

  /**
   * Query information in detail page tabs
   */
  static async queryInnerDetail(
    token: string,
    criteria: Array<any>,
    userId: any,
    objectApiName: string,
    pageSize: number,
    pageNo: number,
  ) {
    const queryUrl = `${Config.baseURL}${Config.api.record_query}`;
    const requestBody = generateDetailHeader(token, criteria, objectApiName, pageSize, pageNo);

    console.log(`===>inner http request url: ${queryUrl}`, requestBody);

    const data = await request(queryUrl, 'POST', requestBody);
    return handleResult(data);
  }

  /**
   * Request for user's basic information
   * @returns {Promise<null>}
   */
  static async queryUserBasicInfo({
    objectApiName,
    userId,
    token,
    headerLogs = {},
  }: {
    objectApiName: string,
    userId: any,
    token: string,
  }) {
    const url = `${Config.baseURL}${Config.api.record_base}/${objectApiName}/${userId}?token=${token}`;
    const data = await request(url, 'GET', {}, headerLogs);
    return handleResult(data);
  }

  static async basicGetQuery(url, headerLogs = {}) {
    const data = await request(url, 'GET', {}, headerLogs);
    return handleResult(data);
  }

  /**
   * Request for user's basic information
   * @returns {Promise<null>}
   */
  static async queryFileInfo({ key, token }: { key: string, token: string }) {
    let data;
    const url = `${Config.file_server}${Config.api.upload_files}/${key}/info?token=${token}`;
    try {
      data = await request(url, 'GET');
    } catch (e) {
      console.error('queryFileInfo error', e);
      data = { _error: 'queryFileInfo error' };
    }
    return { ...data, key };
  }

  /**
   * Update a single record
   */
  static async updateSingleRecord({
    objectApiName,
    userId,
    token,
    updateData,
    oldRecord,
  }: {
    objectApiName: string,
    userId: any,
    token: string,
    updateData: any,
    oldRecord: any,
  }) {
    if (!updateData) {
      throw new Error('data to be updated is not valid!');
    }

    const path = Config.api.record.replace('{api_name}', objectApiName);
    // .replace('{id}', userId);
    let method = 'POST';
    let url = `${Config.baseURL}${path}`;
    if (userId) {
      method = 'PUT';
      url = `${url}/${userId}`;
    }
    const requestBody = generateUpdateBody(_.assign({}, oldRecord, updateData), token);
    const result = await request(url, method, requestBody);
    return handleResult(result);
  }

  /**
   * delete a single record
   */

  static async deleteSingleRecord({
    objectApiName,
    token,
    id,
  }: {
    objectApiName: string,
    token: string,
    id: any,
  }) {
    console.log(objectApiName, token, id);
    const path = Config.api.record.replace('{api_name}', objectApiName);
    // .replace('{id}', userId);
    const method = 'DELETE';
    let url = `${Config.baseURL}${path}`;
    if (id && token) {
      url = `${url}/${id}?token=${token}`;
    }

    const result = await request(url, method);
    return result;
  }

  /**
   * Convert an object to query string, like: '?a=value1&b=value2'
   * @param {*} paramObj object which will be converted.
   */
  static objectToQueryString(paramObj: {}) {
    return `?${Object.keys(paramObj)
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(paramObj[key])}`)
      .join('&')}`;
  }

  // 选择岗位接口请求
  static async changeAuthTerritory(token, data) {
    const url = `${Config.ssoURL}/change_auth_territory`;
    const method = 'POST';

    const requestBody = {
      head: {
        token,
      },
      body: data,
    };
    const result = await request(url, 'POST', requestBody);
    if (!result) {
      return [true, null];
    }
    const newUserInfo = handleResult(result);
    newUserInfo.token = token;
    const newUserInfoObj = await UserService.requestLogin(null, true, newUserInfo);
    return newUserInfoObj;
  }
}

function generateUpdateBody(data: any, token) {
  return {
    body: {
      ...data,
    },
    head: {
      token,
    },
  };
}

/**
 * Generate query profile data http request body
 */
function generateRequestBody(token, profileId) {
  const body = {
    joiner: 'and',
    criterias: [
      {
        field: 'profile',
        operator: '==',
        value: [profileId],
      },
    ],
    orderBy: 'create_time',
    order: 'asc',
    objectApiName: 'crmpower_setting',
    pageSize: 10,
    pageNo: 1,
  };
  return {
    head: {
      token,
    },
    body,
  };
}

/**
 * Generate http request body for querying data
 */
function generateQueryHeader(
  token: string,
  objectApiName: string,
  criteria: Array<any>,
  territoryCriterias?: Array<any>,
  joiner: string,
  orderBy: string,
  order: string,
  pageSize: number,
  pageNo: number,
  other = {},
) {
  return {
    head: {
      token,
    },
    body: {
      joiner,
      criterias: criteria,
      territoryCriterias,
      orderBy,
      order,
      objectApiName,
      pageSize,
      pageNo,
      ...other,
    },
  };
}

/**
 *
 */
function generateDetailHeader(
  token: string,
  criteria: Array<any>,
  objectApiName: string,
  order: string = 'asc',
  pageSize: number = 10,
  pageNo: number = 1,
) {
  return {
    head: {
      token,
    },
    body: {
      joiner: 'and',
      criterias: criteria,
      orderBy: 'update_time',
      order: 'asc',
      objectApiName,
      pageSize,
      pageNo,
    },
  };
}
