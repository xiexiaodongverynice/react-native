/**
 * Created by Uncle Charlie, 2018/01/12
 * 业务相关的全局变量，会随着业务场景变化（登录、登出、更新、重置）
 * @flow
 */
/*  eslint-disable */

import _ from 'lodash';
import moment from 'moment';
import UserService from '../services/userService';
import * as CRMUtils from './index';
import { deployEnvironment } from './config';

/**
 * 给表达式使用的全局函数
 */
global.moment = moment;
global.getDeployEnvironment = () => deployEnvironment;
global.deployEnvironment = deployEnvironment;

/**
 * Global cachs
 */
export default {
  currentUserId: '',
  currentToken: '',
  IS_APP_ACTIVE: false, // * 主动监控app是否处于未唤醒状态(在拍照，查看相册等，超过指定时间会自动登出)
  clearGlobals() {
    global.FC_CRM_TOKEN = '';
    global.FC_CRM_SUBORDINATES = '';
    global.FC_CRM_ALL_SUBORDINATES = '';
    global.FC_CRM_PARENT_SUBORDINATES = '';
    global.FC_CRM_TERRITORY_CUSTOMER_IDS = '';
    global.CURRENT_ACTIVE_TERRITORY = '';
    global.USER_TERRITORY_LIST_ARR = '';
    global.CRM_SETTINGS = {};
  },

  setupGlobals({ permission, profile }) {
    global.fc_hasFunctionPrivilege = function(functionCode: string, expectedValue: number = 2) {
      if (_.isEmpty(functionCode)) {
        return false;
      }
      const permissionValue = _.get(permission, `function.${functionCode}`);
      return permissionValue === expectedValue;
    };
    global.CRMUtils = CRMUtils;

    //* 获取简档信息
    if (!_.isEmpty(profile)) {
      global.fc_getProfile = () => profile;
    }
  },

  async setGlobalCRMSettings(
    active_territory: any,
    crmSettings: any,
    currentUserId: string,
    currentToken: string,
    userInfo: any,
    profile: any,
    permission: any,
    objectDescription: any,
    cacheSetting: any,
  ) {
    global.fc_hasFunctionPrivilege = function(functionCode: string, expectedValue: number = 2) {
      if (_.isEmpty(functionCode)) {
        return false;
      }
      const permissionValue = _.get(permission, `function.${functionCode}`);
      return permissionValue === expectedValue;
    };

    global.fc_hasObjectPrivilege = function(objectCode: string, expectedValue: any = 0) {
      if (_.isEmpty(objectCode)) {
        return false;
      }

      const permssionValue = _.get(permission, `obj.${objectCode}`);
      return (permssionValue | Math.pow(2, expectedValue)) === permssionValue;
    };

    global.fc_getObjectDescribe = (api_name) => {
      if (_.isEmpty(objectDescription)) return null;

      return _.chain(objectDescription)
        .result('items', [])
        .find({
          api_name,
        })
        .value();
    };

    global.CRMUtils = CRMUtils;

    //* 获取简档信息
    if (!_.isEmpty(profile)) {
      global.fc_getProfile = () => profile;
    }

    if (userInfo) {
      const teamId = _.get(userInfo, 'tenant_id');
      if (teamId) {
        global.TEAMID = teamId;
      }
    }

    if (!crmSettings) {
      console.log('global setting with invalid value!');
    } else {
      global.CALL_BACKDATE_LIMIT = _.get(crmSettings, 'call_backdate_limit', '');
      global.EDIT_SEGMENTATION = _.get(crmSettings, '', 'edit_segmentation', '');
      global.ADD_SEGMENTATION_ONLY = _.get(crmSettings, 'add_segmentation_only', '');
      global.SEGMENTATION_AUTHORITY = _.get(crmSettings, 'segmentation_authority', '');
      global.SEGMENTATION_PRODUCT_LEVEL = _.get(crmSettings, 'segmentation_product_level', '');
      global.DCR_EDIT_CUSTOMER_RULE = _.get(crmSettings, 'dcr_edit_customer_rule', '');
      global.DCR_CREATE_CUSTOMER_RULE = _.get(crmSettings, 'dcr_create_customer_rule', '');
      global.CRM_SETTINGS = crmSettings;
    }

    /**
     * 下属
     */
    if (!global.FC_CRM_SUBORDINATES || !global.FC_CRM_ALL_SUBORDINATES) {
      const subordinates = _.get(cacheSetting, UserService.subordinateCacheKey(currentUserId), []);
      const allSubordinates = _.get(
        cacheSetting,
        UserService.allSubordinateCacheKey(currentUserId),
        [],
      );

      global.FC_CRM_SUBORDINATES = subordinates;
      global.FC_CRM_ALL_SUBORDINATES = allSubordinates;
    }
    /**
     * 上级下属
     */
    if (!global.FC_CRM_PARENT_SUBORDINATES) {
      const parent_subordinates = _.get(
        cacheSetting,
        UserService.parentSubordinateCacheKey(currentUserId),
        [],
      );

      global.FC_CRM_PARENT_SUBORDINATES = parent_subordinates;
    }

    if (!global.FC_CRM_TERRITORY_CUSTOMER_IDS) {
      const territoryCuystomerIds = _.get(
        cacheSetting,
        UserService.territoryCustomerIdsCacheKey(currentUserId),
        [],
      );

      global.FC_CRM_TERRITORY_CUSTOMER_IDS = territoryCuystomerIds;
    }

    //* 岗位下属territoryId 集合(不包含共享岗位和虚拟岗位)
    global.FC_CRM_TERRITOYIDS = _.get(
      cacheSetting,
      UserService.territoryIdCacheKey(currentUserId),
      [],
    );

    //* 直接下级(不包含共享岗位)
    global.FC_CRM_DIRECTSUB = _.get(
      cacheSetting,
      UserService.directSubordinateCacheKey(currentUserId),
      [],
    );

    global.fc_getSubordinateIds = (type) => {
      const FC_CRM_SUBORDINATES_FILTER = _.filter(global.fc_getSubordinates(type), (x) =>
        _.get(x, 'id', false),
      );
      return _.map(FC_CRM_SUBORDINATES_FILTER, (x) => x.id);
    };
    /**
     * 上级下属ids
     */

    global.fc_getParentSubordinateIds = () => {
      const FC_CRM_PARENT_SUBORDINATES_FILTER = _.filter(global.FC_CRM_PARENT_SUBORDINATES, (x) =>
        _.get(x, 'id', false),
      );
      return _.map(FC_CRM_PARENT_SUBORDINATES_FILTER, (x) => x.id);
    };
    global.fc_getSubordinates = (type) => {
      if (!type) {
        //* 有虚线下级返回虚线下级，没有返回岗位下级
        return global.FC_CRM_SUBORDINATES;
      } else if (type === 'all') {
        //* 虚线下级和直接下级包括自己
        return global.FC_CRM_ALL_SUBORDINATES;
      } else if (type === 'by_territory') {
        const allSubors = global.FC_CRM_ALL_SUBORDINATES;
        const userDoitSubors = global.fc_getDotedSubordinateIds();
        // * _.dropWhile 这个方法有坑
        // * 不行可以用下面的remove方法
        return _.dropWhile(
          allSubors,
          (sub) => _.includes(userDoitSubors, sub.id) && sub.dotted_line_manager,
        );
        // * _.remove(allSubors, (sub) => {
        // *  return (
        // *    (_.includes(userDoitSubors, sub.id) && sub.dotted_line_manager) ||
        // *    sub.parent_territory_id != global.CURRENT_ACTIVE_TERRITORY
        // *  );
        // * });
        // * return allSubors;
      } else if (type === 'by_user') {
        //* 虚线下级和虚线下级的岗位下级
        const allSubors = global.FC_CRM_ALL_SUBORDINATES;
        let userDoitSubors = [];
        _.each(allSubors, (sub) => {
          if (sub && sub.dotted_line_manager && sub.dotted_line_manager === currentUserId) {
            userDoitSubors.push(sub);
            const subArray = global.findUsers(allSubors, 'parent_id', sub.id);
            userDoitSubors = _.concat(userDoitSubors, subArray);
          }
        });

        return userDoitSubors;
      }
    };

    /**
     * 获取虚线下级id集合
     */
    global.fc_getDotedSubordinateIds = () => global.fc_getDotedSubordinates().map((x) => x.id);

    /**
     * 获取虚线下级
     */
    global.fc_getDotedSubordinates = () => {
      const allSubors = global.FC_CRM_ALL_SUBORDINATES;
      let userDoitSubors = [];
      _.each(allSubors, (sub) => {
        if (sub && sub.dotted_line_manager && sub.dotted_line_manager == global.FC_CRM_USERID) {
          userDoitSubors.push(sub);
          userDoitSubors = global.findUsers(allSubors, 'parent_id', sub.id, userDoitSubors);
        }
      });
      return userDoitSubors;
    };

    /**
     * 递归查找用户方法
     * @param {需要遍历的集合} array
     * @param {根据key进行遍历比较} key
     * @param {需要比较的值} compareId
     * @param {遍历的结果集} result
     */
    global.findUsers = (array = [], key = 'parent_id', compareId, result = []) => {
      _.each(array, (item) => {
        if (item[key] == compareId) {
          if (item.id) {
            result.push(item);
            global.findUsers(array, key, item.id, result);
          }
        }
      });
      return result;
    };

    global.userTerritoryArray = [];
    global.findTerritoryUser = (array = [], key = 'parent_territory_id', compareId) => {
      _.each(array, (item) => {
        if (item && item[key] === compareId) {
          if (item && item.territory_id) {
            global.userTerritoryArray.push(item);
            global.findTerritoryUser(array, key, item.territory_id);
          }
        }
      });
      return global.userTerritoryArray;
    };

    global.fc_getParentSubordinates = () => global.FC_CRM_SUBORDINATES;
    global.fc_getTerritoryCustomerIds = () => global.FC_CRM_TERRITORY_CUSTOMER_IDS;

    /**
     * * 默认返回当前岗位，及所有下级岗位id集合（不包含共享岗位）
     * * type 为 'all' 返回当前岗位，及所有下级岗位、共享岗位id集合
     * * type 为 'direct' 返回当前岗位，及所有直接下级岗位id集合（只向下查一级下级）
     * @param {type} string
     * @param {岗位territory_id 集合} result
     */
    global.fc_getSubTerritoryIds = (type: 'all' | 'direct'): Array => {
      let subTerritoryIds = [];
      if (type === 'all') {
        _.each(global.FC_CRM_ALL_SUBORDINATES, (user) => {
          _.get(user, 'territory_id') && subTerritoryIds.push(_.get(user, 'territory_id'));
        });
      } else if (type === 'direct') {
        subTerritoryIds = global.FC_CRM_DIRECTSUB;
      } else {
        subTerritoryIds = global.FC_CRM_TERRITOYIDS;
      }

      return subTerritoryIds;
    };

    //* 直接岗位下级集合(包含共享岗位)
    global.fc_getDirectSubordinates = () =>
      global
        .fc_getSubordinates('by_territory')
        .filter((x) => x.parent_territory_id == global.CURRENT_ACTIVE_TERRITORY);

    //* 直接岗位下级 ID 集合(包含共享岗位)
    global.fc_getDirectSubordinateIds = () =>
      global
        .fc_getDirectSubordinates()
        .filter((e) => _.get(e, 'id', false))
        .map((x) => x.id);

    if (!currentUserId) {
      console.log('currentUserId is invalid!');
    } else {
      global.FC_CRM_USERID = currentUserId;
    }

    if (!currentToken) {
      console.log('currentToken is invalid!');
    } else {
      global.FC_CRM_TOKEN = currentToken;
      global.getToken = () => currentToken;
    }

    global.FC_CRM_USERNAME = _.get(userInfo, 'name', '');

    global.fc_getCurrentUserInfo = (path: string = '') => {
      //不传path，返回完整userInfo。传path返回对应的value
      if (path === '') {
        return userInfo;
      } else {
        return _.get(userInfo, path);
      }
    };

    //* 非多岗时岗位ID == active_territory
    if (active_territory) {
      global.CURRENT_ACTIVE_TERRITORY = active_territory;
    }
  },

  setIntlUtilData(data) {
    global.INTL_UTIL_DATA = data;
  },

  removeIntlUtilData() {
    global.INTL_UTIL_DATA = {};
  },

  //* 多岗选择id用于查询条件(岗位ID)
  setCurrentActiveTerritory(id) {
    global.CURRENT_ACTIVE_TERRITORY = id;
  },

  setUserTerritoryListArr(params) {
    global.USER_TERRITORY_LIST_ARR = JSON.stringify(params);
  },

  //* 手动设置app使用状态
  disableTokenAutoCleaner() {
    global.IS_APP_ACTIVE = true;
  },
  enableTokenAutoCleaner() {
    global.IS_APP_ACTIVE = false;
  },
};
