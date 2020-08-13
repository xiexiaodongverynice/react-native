import _ from 'lodash';
import moment from 'moment';

const SETTING_FIELD = {
  TARGET_DATE_MATCH_PHOTO: 'target_date_match_photo',
  DISABLED_TIP_TITLE: 'disabled_tip_title',
  RELATIVE_LOCATION_FIELD: 'relativeLocationField', //* 确认相对位置字段
};

//* 假数据集合
const getForgeData = () => ({
  owner: global.FC_CRM_USERID,
  create_time: moment().valueOf(),
  update_time: moment().valueOf(),
  create_by: global.FC_CRM_USERID,
  update_by: global.FC_CRM_USERID,
  create_by__r: {
    name: global.FC_CRM_USERNAME,
    id: global.FC_CRM_USERID,
  },
  update_by__r: {
    name: global.FC_CRM_USERNAME,
    id: global.FC_CRM_USERID,
  },
  owner__r: {
    name: global.FC_CRM_USERNAME,
    id: global.FC_CRM_USERID,
  },
});

//* 签到字段
const SIGN_IN_STATE = {
  location: 'sign_in_location',
  latitude: 'sign_in_latitude',
  longitude: 'sign_in_longitude',
  time: 'sign_in_time',
  photo: 'sign_in_photo',
  abnormal: 'abnormal_sign_in',
  deviation: 'sign_in_deviation',
  extra: 'sign_in_extra',
};

// *签出字段
const SIGN_OUT_STATE = {
  location: 'sign_out_location',
  latitude: 'sign_out_latitude',
  longitude: 'sign_out_longitude',
  time: 'sign_out_time',
  photo: 'sign_out_photo',
  abnormal: 'abnormal_sign_out',
  deviation: 'sign_out_deviation',
  extra: 'sign_out_extra',
};

//* 超时时间
const COUNT_APP_TIME = 'count_app_time';

// 租户ID
const TENANT_ID_COLLECT = {
  JMKX_TENEMENT: [
    'T8017851384171529',
    'T8067297675447296',
    'T8087395524742152',
    'T8389310571023369',
    'T8426801418112000',
  ],
  MYLAN_TENEMENT: [
    'T7970395608550402',
    'T8199700825082882',
    'T8258661973494787',
    'T8278788381543428',
  ],
  CHENPON_TENEMENT: ['T7684028447329283', 'T7684209048357890'],
  LUOZHEN_TENEMENT: [
    'T8049506594262021',
    'T8200040335019009',
    'T8313225060191236',
    'T8366657535282184',
  ],
  HENRUI: ['T8559716081044486', 'T8743344183086085'],
  SHGVP: ['T7324249927093250', 'T7641332615842816', 'T8635535441300480'],
};

const crmTenant_isjmkx = () => TENANT_ID_COLLECT.JMKX_TENEMENT.includes(global.TEAMID);

const crmTenant_ishenrui = () => TENANT_ID_COLLECT.HENRUI.includes(global.TEAMID);

const crmTenant_luozhen = () => TENANT_ID_COLLECT.LUOZHEN_TENEMENT.includes(global.TEAMID);

const crmTenant_isShgvp = () => TENANT_ID_COLLECT.SHGVP.includes(global.TEAMID);

const stgWBEnvironment = {
  baseURL: 'http://47.103.45.88:8000/fc-crm-tenant-management-application',
  ssoURL: 'http://47.103.45.88:8000/sso-web',
  file_server: 'http://47.103.45.88:8092',
  app_key: 'wangbang',
  deployEnvironment: 'stg',
  previewUrl: 'https://stg-file-preview.crmpower.cn',
};

const prodEnvironment = {
  baseURL: 'https://prod-tm.crmpower.cn',
  ssoURL: 'https://prod-sso.crmpower.cn',
  file_server: 'https://prod-fs.crmpower.cn',
  app_key: 'crmpower',
  deployEnvironment: 'prod',
  previewUrl: 'https://prod-file-preview.crmpower.cn',
};

// Staging
const stgEnvironment = {
  baseURL: 'https://stg-tm.crmpower.cn',
  ssoURL: 'https://stg-sso.crmpower.cn',
  file_server: 'https://stg-fs.crmpower.cn',
  app_key: 'crmpower_dev',
  deployEnvironment: 'stg',
  previewUrl: 'https://stg-file-preview.crmpower.cn',
};

// jmkx prod
const jmkxProdEnvironment = {
  baseURL: 'http://sfe.jemincare.com:81/fc-crm-tenant-management-application', // http://47.106.252.204:8098
  ssoURL: 'http://sfe.jemincare.com:81/sso-web', // http://47.106.252.204:8090
  file_server: 'http://47.106.252.204:8092', // http://sfe.jemincare.com:81/fc-crm-file-service
  app_key: 'jmkx',
  deployEnvironment: 'prod',
  previewUrl: 'https://prod-file-preview.crmpower.cn',
};

// jmkx test 预发环境
const jmkxTestEnvironment = {
  baseURL: 'http://47.107.181.9:8098',
  ssoURL: 'http://47.107.181.9:8090',
  file_server: 'http://47.107.181.9:8092',
  app_key: 'jmkx_dev',
  deployEnvironment: 'stg',
  previewUrl: 'https://prod-file-preview.crmpower.cn',
};

const wangbangStgEnvironment = {
  baseURL: 'http://47.103.45.88:8098',
  ssoURL: 'http://47.103.45.88:8090',
  file_server: 'http://47.103.45.88:8092',
  app_key: 'wangbang',
  deployEnvironment: 'stg',
  previewUrl: 'https://stg-file-preview.crmpower.cn',
};

// Dev
const devEnvironment = {
  baseURL: 'http://dev-tm.crmpower.cn',
  ssoURL: 'http://dev-sso.crmpower.cn',
  file_server: 'http://dev-fs.crmpower.cn',
};

export {
  SIGN_IN_STATE,
  SIGN_OUT_STATE,
  TENANT_ID_COLLECT,
  COUNT_APP_TIME,
  SETTING_FIELD,
  getForgeData,
  prodEnvironment,
  stgEnvironment,
  jmkxProdEnvironment,
  devEnvironment,
  crmTenant_isjmkx,
  crmTenant_luozhen,
  crmTenant_ishenrui,
  crmTenant_isShgvp,
  stgWBEnvironment,
  wangbangStgEnvironment,
  jmkxTestEnvironment,
};
