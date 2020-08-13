/**
 * Created by Guanghua on 12/15;
 * @flow
 */

import _ from 'lodash';
import request from '../utils/request';
import request_insightFailreason from '../utils/request_insightFailreason';
import Config from '../utils/config';
import CacheService from '../services/cache';
import { handleSSOResult } from '../utils/handler';
import { mapDeleteDuplicating } from '../utils/helpers/DeleteDuplicating';
import Globals from '../utils/Globals';
import { LOGIN_CACHE_KEYS } from '../utils/constants';
import { fetchCrmPowerSetting, fetchTabs, fetchObjectDescriptions, fetchProfile } from './settings';
import IntlUtils from './intlUtils';
import IndexDataParser from './dataParser';
import AcStorage from '../utils/AcStorage';
import LocalLog from '../utils/LocalLog';
import I18n, { CURRENT_LOCALE_KEY } from '../i18n';
import helpGlobal from '../utils/helpers/helpGlobal';

export default class UserService {
  static currentUserId = '';
  static subordinateCacheKey = (userId: string) => `subordinates_${userId}`;
  static allSubordinateCacheKey = (userId: string) => `all_subordinates_${userId}`;
  static parentSubordinateCacheKey = (userId: string) => `parent_subordinates_${userId}`;
  static territoryCustomerIdsCacheKey = (userId: string) => `territory_customer_ids_${userId}`;
  static directSubordinateCacheKey = (userId: string) => `direct_subordinate_${userId}`;
  static territoryIdCacheKey = (userId: string) => `territory_ids_${userId}`;
  static getLoginCacheKeys = (userId: string): Array<string> =>
    _.concat(
      LOGIN_CACHE_KEYS,
      UserService.subordinateCacheKey(userId),
      UserService.parentSubordinateCacheKey(userId),
      UserService.territoryCustomerIdsCacheKey(userId),
    );

  /**
   * Login user
   * @param {*} userInfo
   */
  static async login(userInfo: any) {
    const { uuid, processBegin, storageEnd } = LocalLog.storageBegin();
    const headerLogs = LocalLog.jointLogParams({ uuid, objectApiName: 'sso', processBegin });
    try {
      // 登陆接口
      const response = await request(`${Config.ssoURL}/login`, 'POST', userInfo, headerLogs);
      const body = handleSSOResult(response);
      if (!body) {
        console.warn('===>login request failed');
        return [new Error('Login error'), null];
      }
      const { token } = response.head;
      body.token = token;
      //* 如果登陆接口返回的数据为岗位数组
      // const userTerritoryList = _.get(body, 'userTerritoryList', []);
      const userTerritoryArr = _.get(body, 'userTerritoryList', []);
      const userTerritoryList = mapDeleteDuplicating(userTerritoryArr, 'id');
      if (!_.isEmpty(userTerritoryList)) {
        //* is_primary判断是不是主岗，且这一条主岗数据排第一位
        const newArr = [];
        _.map(userTerritoryList, (item, i) => {
          if (item.is_primary) {
            item.isSelectedMark = true;
            newArr.unshift(item);
          } else {
            item.isSelectedMark = false;
            newArr.push(item);
          }
        });
        body.userTerritoryList = newArr;
        return [null, body];
      }
      const otherLoginInfo = await UserService.otherLoginInfo(body, headerLogs);
      storageEnd({ layoutApiName: 'sso', objectApiName: 'sso' });
      return otherLoginInfo;
    } catch (e) {
      console.error('Login error', e);
      return [e, null];
    }
  }

  static async otherLoginInfo(userInfo: any, headerLogs: object) {
    const { permission, profile, userId, user_info, token, active_territory } = userInfo;
    UserService.currentUserId = userId;
    const [
      crmPowerSettingData = {},
      tabs = {},
      objectDescription = {},
      fullProfile = {},
      intlType = '',
      intlAllLan = {},
      homeConfig = {},
      subordinates,
      parentSubordinates,
      territoryCustomerIds,
      DirectSubordinates,
      territoryIds,
      requestAllSubordinates,
    ] = await Promise.all([
      fetchCrmPowerSetting(token, profile.id, headerLogs),
      fetchTabs(token, headerLogs),
      fetchObjectDescriptions(true, token, headerLogs),
      fetchProfile(token, profile.id, headerLogs),
      IntlUtils.getDefaultLan(token, headerLogs),
      IntlUtils.getAllLan(token, headerLogs),
      IntlUtils.getHomeConfig(token, headerLogs, profile),
      UserService.requestSubordinates(userId, token, false, headerLogs), //*获取本身及下属岗位信息(包含共享岗位、虚线)
      UserService.requestSubordinates(userId, token, true, headerLogs), //* 获取本身及下属和上级岗位信息(包含共享岗位、虚线)
      UserService.requestTerritoryCustomerIds({ userId, token, headerLogs }),
      UserService.requestDirectSub({ userId, token, headerLogs }),
      UserService.requestTerritoryIds({ userId, token, headerLogs }),
      UserService.requestAllSubordinates(userId, token, headerLogs),
    ]);
    return [
      null,
      {
        active_territory,
        crmPowerSetting: _.get(crmPowerSettingData, 'result[0]', {}),
        tabs,
        objectDescription,
        fullProfile,
        intlType,
        intlAllLan,
        homeConfig,
        userId,
        permission,
        profile,
        token,
        userInfo: user_info,
        [UserService.subordinateCacheKey(userId)]: subordinates || [],
        [UserService.parentSubordinateCacheKey(userId)]: parentSubordinates || [],
        [UserService.territoryCustomerIdsCacheKey(userId)]: territoryCustomerIds || [],
        [UserService.directSubordinateCacheKey(userId)]: DirectSubordinates || [],
        [UserService.territoryIdCacheKey(userId)]: territoryIds || [],
        [UserService.allSubordinateCacheKey(userId)]: requestAllSubordinates || [],
      },
    ];
  }

  /**
   * Login v2
   */
  static async requestLogin(userInfo: any, isChangeTerritory: any, newUserInfo: any) {
    try {
      let arr = [null, null];
      if (isChangeTerritory) {
        //* 应用内选择岗位
        arr = await UserService.otherLoginInfo(newUserInfo);
      } else {
        //* 登陆
        arr = await UserService.login(userInfo, isChangeTerritory, newUserInfo);
      }
      const [loginErr, loginResult] = arr;

      if (loginErr) {
        console.warn('===>requestLogin login error', loginErr);
        return [loginErr, null];
      }

      UserService.refreshI18n(loginResult);

      //* 将获取数据存入文件缓存中
      CacheService.storeMultiCache(loginResult);
      return [null, loginResult];
    } catch (e) {
      return [e, null];
    }
  }

  static async requestSubordinates(
    userId: string,
    token: string,
    parent: boolean,
    headerLogs: object = {},
  ) {
    const url = `${Config.baseURL}${Config.api.subordinate_query}${userId}?token=${token}&${
      parent ? 'parent=true' : ''
    }`;
    const response = await request(url, 'GET', { token }, headerLogs);

    if (response.head.code !== 200) {
      console.error(`request subordinate of userID${userId}error`, response.head.msg);
      return null;
    }
    return response.body.result;
  }

  static async requestAllSubordinates(userId: string, token: string, headerLogs: object = {}) {
    const url = `${Config.baseURL}${Config.api.subordinate_query}${userId}?token=${token}&parent=false&&sub_type=all`;
    const response = await request(url, 'GET', { token }, headerLogs);

    if (response.head.code !== 200) {
      console.error(`request subordinate of userID${userId}error`, response.head.msg);
      return null;
    }
    return response.body.result;
  }

  static async logout() {
    try {
      await CacheService.removeAll(LOGIN_CACHE_KEYS);
      UserService.clearRedisToken(global.FC_CRM_TOKEN);
      UserService.resetI18n();
      //* 清除对象描述缓存
      IndexDataParser.descriptionByApiName = {};
      Globals.clearGlobals();
      // AcStorage.remove('userTerritoryListArr');
      return true;
    } catch (e) {
      return false;
    }
  }

  static resetI18n() {
    I18n.reset();
  }

  static refreshI18n(data) {
    AcStorage.get(CURRENT_LOCALE_KEY)
      .then((res) => {
        I18n.refresh({ ...data, [CURRENT_LOCALE_KEY]: JSON.parse(res) });
      })
      .catch(() => {
        I18n.refresh(data);
      });
  }

  //* 清除redis的token数据
  static async clearRedisToken(token) {
    const url = `${Config.ssoURL}/logout`;
    const payload = {
      body: {
        token,
      },
    };
    await request(url, 'POST', payload);
  }

  static async changePassword(payload: any) {
    const url = `${Config.ssoURL}/updateMyPwd`;
    const response = await request(url, 'POST', payload);
    if (response.head.code !== 200) {
      throw new Error(response.head.msg);
    } else {
      return response;
    }
  }

  static async findPassword(userInfo: any) {
    const val = await request(`${Config.ssoURL}/resetMyPwd`, 'POST', userInfo);
    if (val.head.code !== 200) {
      throw new Error(val.head.msg);
    } else {
      return true;
    }
  }

  //*仅返回当前用户的直属客户，不包含下属、虚线下级、shared_territory的客户
  static async requestTerritoryCustomerIds({
    userId,
    token,
    headerLogs = {},
  }: {
    userId: string,
    token: string,
    headerLogs: object,
  }) {
    const url = `${Config.baseURL}${Config.api.territory_customer_query}/${userId}?token=${token}`;
    const data = await request(url, 'GET', {}, headerLogs);

    if (!data || _.get(data, 'head.code', -1) !== 200) {
      throw new Error(_.get(data, 'head.msg', 'Http request error!'));
    }
    return data.body.result;
  }

  //* 获取下级岗位territoryIds(不包含共享岗位、虚线岗位)
  static async requestTerritoryIds({
    userId,
    token,
    headerLogs = {},
  }: {
    userId: string,
    token: string,
    headerLogs: object,
  }) {
    const url = `${Config.baseURL}${Config.api.territory_id_query}/${userId}?restrict=true&token=${token}`;
    const data = await request(url, 'GET', {}, headerLogs);

    if (!data || _.get(data, 'head.code', -1) !== 200) {
      throw new Error(_.get(data, 'head.msg', 'Http request error!'));
    }
    return data.body.result;
  }

  //* 获取当前岗位和直接下级(不包含共享岗位)
  static async requestDirectSub({
    userId,
    token,
    headerLogs = {},
  }: {
    userId: string,
    token: string,
    headerLogs: object,
  }) {
    const url = `${Config.baseURL}${Config.api.list_tutorial_territory.replace(
      '{id}',
      userId,
    )}?restrict=true&token=${token}`;
    const data = await request(url, 'GET', {}, headerLogs);

    if (!data || _.get(data, 'head.code', -1) !== 200) {
      throw new Error(_.get(data, 'head.msg', 'Http request error!'));
    }
    return data.body.result;
  }
}

type Type_login_insightFailreason = { err: Error, result: any };

async function login_insightFailreason(userInfo: any): Type_login_insightFailreason {
  const { uuid, processBegin, storageEnd } = LocalLog.storageBegin();
  const headerLogs = LocalLog.jointLogParams({ uuid, objectApiName: 'sso', processBegin });
  // 登陆接口
  const { err, jsonResult } = await request_insightFailreason(
    `${Config.ssoURL}/login`,
    'POST',
    userInfo,
    headerLogs,
  );
  //如果有错误，立即返回
  if (err) {
    return { err };
  }

  //检查code，code不符合业务规则，立即返回
  const code = _.get(jsonResult, 'head.code');
  const msg = _.get(jsonResult, 'head.msg', 'server did not return head.msg');
  if (![200, 201].includes(code)) {
    const err = new Error(msg);
    return { err };
  }

  //检查body，body不符合，立即返回
  const body = _.get(jsonResult, 'body');
  if (!_.isObject(body)) {
    const err = new Error('Login error body is not object');
    return { err };
  }

  //保存token
  body.token = _.get(jsonResult, 'head.token');

  //* 如果登陆接口返回的数据为岗位数组
  const userTerritoryArr = _.get(body, 'userTerritoryList', []);
  const userTerritoryList = mapDeleteDuplicating(userTerritoryArr, 'id');

  if (!_.isEmpty(userTerritoryList)) {
    //* is_primary判断是不是主岗，且这一条主岗数据排第一位
    const newArr = [];
    _.map(userTerritoryList, (item, i) => {
      if (item.is_primary) {
        item.isSelectedMark = true;
        newArr.unshift(item);
      } else {
        item.isSelectedMark = false;
        newArr.push(item);
      }
    });
    body.userTerritoryList = newArr;
    return { err: null, result: body };
  }

  //otherLoginInfo执行过程中可能throw，需要try
  try {
    const otherLoginInfoResult = await UserService.otherLoginInfo(body, headerLogs);
    const result = otherLoginInfoResult[1]; //otherLoginInfo返回数组，[0]总是null，[1]才是需要的对象
    storageEnd({ layoutApiName: 'sso', objectApiName: 'sso' });
    return { err: null, result }; //真的登录成功
  } catch (e) {
    const err = new Error('otherLoginInfo fail:' + e.toString());
    return { err };
  }
}

//登录
async function requestLogin_insightFailreason(userInfo: any): Type_login_insightFailreason {
  const { err, result } = await UserService.login_insightFailreason(userInfo);

  if (err) {
    return { err, result };
  }
  UserService.refreshI18n(result);

  //* 将获取数据存入文件缓存中
  CacheService.storeMultiCache(result);
  return { err, result };
}

UserService.login_insightFailreason = login_insightFailreason;
UserService.requestLogin_insightFailreason = requestLogin_insightFailreason;
