/**
 * Created by Uncle Charlie, 2017/12/10
 * @flow
 */

export default {
  /**
   * If parameter is not an array or the array is empty,
   * return true. Or return false.
   * @param {*} array
   */
  isEmptyArray(array) {
    if (!Array.isArray(array)) {
      return true;
    }

    return !(array && array.length > 0);
  },
  pageSize: 20,
  filterNum: 10,

  getLayoutKey({ objectApiName, layoutType, recordType }) {
    return `layout_${objectApiName}_${layoutType}_${recordType}`;
  },
  // Page layout
  layoutTypeIndex: 'index_page',
  layoutTypeDetail: 'detail_page',
  layoutTypeIndexKey: 'index',
  layoutTypeDetailKey: 'detail',
  layoutTypeRelationLookup: 'relation_lookup_page',
};

export const LOGIN_CACHE_KEYS = [
  'permission',
  'profile',
  'userId',
  'token',
  'userInfo',
  'tabs',
  'crmPowerSetting',
  'objectDescription',
  'fullProfile',
  'homeConfig',
];

const team_key = {
  crmpower: {
    code_push: {
      ios: {
        dev: 'S9Z9hIdlbxyHNvNveVJZ5D4uBQ1Y4ksvOXqog',
        stg: 'wi8CQ2PKDexVvAcsxUIh2CSKWlUB4ksvOXqog',
        prod: 'IQ8mRAVgjsaBBef0NOPxKqdvklj24ksvOXqog',
      },
      android: {
        dev: 'GJX6E9EY4I7hbfii7Bwv0nFkSdS24ksvOXqog',
        stg: '5Ry2JV8pg40ShBfB07ZdnwmlQzTi4ksvOXqog',
        prod: 'R9vUAwyr1AQ7Izmlz3bSUJYxgSNU4ksvOXqog',
      },
    },
    jupush_key: 'bb1b0e6df25bf7a4c4f6c4e0',
  },
  jmkx: {
    code_push: {
      ios: {
        stg: 'KsCbFMqXDRjLmu1ui6LhArP43kcM4ksvOXqog',
        prod: '6u4Td9UaCdGbBSD4lqb6FVrNuCee4ksvOXqog',
      },
      android: {
        stg: 'NkX3UKTjocWve0Se4WbWdZrupWJO4ksvOXqog',
        prod: 'FzvKsjcLoCXlwiuDBNaVyTLrHOja4ksvOXqog',
      },
    },
    jupush_key: '4ff321f25c62768d7ab9a8a2',
  },
  mylan: {
    code_push: {
      ios: {
        stg: 'now6VNRPVx7xgcAg3787nu38HXwK4ksvOXqog',
        prod: 'wbRdUeR3xAnQYRuRzc2jSIERQmFv4ksvOXqog',
      },
      android: {
        stg: 'TYXUfc8lYdPqayd989RxeaobKHWM4ksvOXqog',
        prod: '2o9SaEcyQoGVOAxAbymc8CJ9vUM64ksvOXqog',
      },
    },
    jupush_key: '505f2037650df536b877ab00',
  },
};
