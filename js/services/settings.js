/**
 * Created by Uncle Charlie, 2017/12/10
 * @flow
 */

import _ from 'lodash';
import Config from '../utils/config';
import request from '../utils/request';
import CacheService from '../services/cache';
import { handleResult } from '../utils/handler';
import IntlUtils from './intlUtils';

export default async function fetchSettings(params: any) {
  try {
    const { token, profile, userInfo, userId } = params;
    const profileId = profile.id;
    const result = await Promise.all([
      fetchCrmPowerSetting(token, profileId),
      fetchTabs(token),
      fetchObjectDescriptions(true, token),
      fetchProfile(token, profileId),
      IntlUtils.getDefaultLan(token),
      IntlUtils.getAllLan(token),
      IntlUtils.getHomeConfig(token),
    ]);

    const fetchedData = {
      crmPowerSetting: _.get(result, '[0].result[0]', {}),
      tabs: _.get(result, '[1]', {}),
      objectDescription: _.get(result, '[2]', {}),
      fullProfile: _.get(result, '[3]', {}),
      intlType: _.get(result, '[4]', ''),
      intlAllLan: _.get(result, '[5]', {}),
      homeConfig: _.get(result, '[6]', {}),
      // territoryCustomerIds: _.get(result, '[4]', {}),
    };

    const resultVal = _.assign({}, params, fetchedData);

    await CacheService.storeMultiCache(resultVal);

    return [null, resultVal];
  } catch (e) {
    console.warn('===>fetch settings error', e);
    return [e, null];
  }
}

export async function fetchCrmPowerSetting(token, profileId, headerLogs = {}) {
  try {
    const url = `${Config.baseURL}${Config.api.record_query}`;
    const requestsBody = generateRequestBody(token, profileId);

    const data = await request(url, 'POST', requestsBody, headerLogs);
    return handleResult(data);
  } catch (e) {
    console.warn('===>fetch CrmPowerSetting', e);
  }
}

export async function fetchProfile(token, profileId, headerLogs = {}) {
  try {
    const url = `${Config.baseURL}${Config.api.record_query}`;
    const requestsBody = generateRequestBody(token, profileId);
    const data = await request(url, 'POST', requestsBody, headerLogs);
    return handleResult(data);
  } catch (e) {
    console.warn('===>fetch profile', e);
  }
}

export async function fetchTabs(token, headerLogs = {}) {
  try {
    const tabsUrl = `${Config.baseURL}${Config.api.tab}?token=${token}`;
    const data = await request(tabsUrl, 'GET', {}, headerLogs);
    return handleResult(data);
  } catch (e) {
    console.warn('===>fetch tabs', e);
  }
}

export async function fetchObjectDescriptions(includeFields, token, headerLogs = {}) {
  try {
    const params = {
      includeFields,
      token,
    };
    const url = `${Config.baseURL}${Config.api.custom_objects_all}${objectToQueryString(params)}`;
    const data = await request(url, 'GET', {}, headerLogs);

    return handleResult(data);
  } catch (e) {
    console.warn('===> fetch object desc', e);
  }
}

export async function getServerTime() {
  try {
    const url = `${Config.baseURL}${Config.api.getServerTime}`;
    const data = await request(url);

    return handleResult(data);
  } catch (e) {
    console.warn('===> fetch object desc', e);
  }
}

function objectToQueryString(paramObj) {
  return `?${Object.keys(paramObj)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(paramObj[key])}`)
    .join('&')}`;
}

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
