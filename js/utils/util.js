/**
 * Created by Uncle Charlie, 2017/12/19
 * @flow
 */
import _ from 'lodash';
import Globals from './Globals';
import React from 'react';
import { Platform, KeyboardAvoidingView, Dimensions } from 'react-native';
import IndexDataParser from '../services/dataParser';
import { Confirm } from '../tabs/common/components';
import themes from '../tabs/common/theme';

const NEEDED_STR_LEN = 10;

/** Photo cache middle path */
export const MIDDLE_PATH = '/photo/cache/';
export const MIDDLE_ATTACH_PATH = '/attachment/cache/';
export const MIDDLE_VIDEO_PATH = '/video/cache/';

export function cutString(text: string, length: number = NEEDED_STR_LEN): string {
  if (text && typeof text === 'string') {
    return text.substring(0, length);
  }
  return text;
}

export function insertArray(target: Array<any>, insertAt: number, item: any) {
  return target.splice(insertAt, 0, item);
}

function _createFunc(expression, param: string = 't') {
  return new Function(param, expression);
}
/**
 * Execute another function from configuration of layouts
 */
export function executeExpression(
  expression: string,
  someParams: any = {},
  anotherParams: any = {},
  relateParams: any = {},
): any {
  try {
    let bindObjShortName;
    const matchName = getFunctionExpressioniBindObjectShortNameIfExpressionMatchReturnFirst(
      expression,
    );
    if (matchName) {
      bindObjShortName = matchName;
    }
    const someFun = _createFunc(expression, bindObjShortName);
    return someFun(someParams, anotherParams, relateParams);
  } catch (e) {
    console.warn('[error] execute expressioin error', e);
    console.warn(
      '[error] execute expressioin params',
      expression,
      someParams,
      anotherParams,
      relateParams,
    );
    return false;
  }
}

function _createfunction(expression) {
  return new Function('t', 'p', 'r', expression);
}

/**
 * JSCore 中创建的 Function 中的作用域是无法访问到外部作用域的，最好采用传值的方式。
 * （如访问外部作用域的 global 等变量，但可以直接访问 global 上的变量。这个应该和 global 的实现有关）
 * @param {*} expression
 * @param {*} someParams
 * @param {*} anotherParams
 * @param {*} relateParams
 */
export function executeDetailExp(
  expression: string,
  someParams: any = {},
  anotherParams: any = {},
  relateParams: any = {},
): any {
  try {
    const fun = _createfunction(expression);
    if (_.isFunction(fun)) {
      return fun(someParams, anotherParams, relateParams);
    } else {
      return true;
    }
  } catch (e) {
    console.log(e);
    console.warn(
      '[error]',
      'expression:',
      expression,
      'someParams:',
      someParams,
      'anotherParams',
      anotherParams,
      'relateParams',
      relateParams,
    );
    console.log('[error], fun:', _createfunction(expression));
    return false;
  }
}

/**
 * 取出表达式中第一个从 t 或 p 中取内容的句子
 * @param {*} expression
 */
export function getFunctionExpressioniBindObjectShortNameIfExpressionMatchReturnFirst(
  expression: string,
) {
  const reg = /\s*return\s+(t|p)\./;
  return _.get(expression.match(reg), '[1]');
}

export function getFileName(uri: string) {
  const fileName = uri.split('/').pop();
  return fileName;
}

export function getFileNameWithoutExtension(uri: string) {
  const filename = getFileName(uri);
  const pointPosition = filename.lastIndexOf('.');
  return filename.substring(0, pointPosition);
}

export function getPhotoKey(path: string) {
  if (path.indexOf('.jpg') > 0) {
    return getFileName(path);
  }

  const rootPath = path.split('?token')[0];
  if (rootPath.indexOf('_') > 0) {
    const photoKey = rootPath.substring(0, rootPath.indexOf('_'));
    return photoKey;
  }
  return rootPath;
}

export function callAnotherFunc(fnFunction, vArgument, pArgument = {}) {
  try {
    if (_.isFunction(fnFunction)) {
      return fnFunction(vArgument, pArgument);
    } else {
      return true;
    }
  } catch (e) {
    console.error('[error]发现错误', fnFunction, vArgument, pArgument);
    return false;
  }
}

/**
 * * 用于汇总页面的setstate，统一触发，防止数据丢失
 * @param data
 * @param removedata 汇总要删除的属性
 * @param cb
 */
export const debounceStateUpdate = (function debounceSet() {
  let preTime = 0;
  const lazy = 300;
  let setTime;
  let waitData = {};
  let waitRemoveData = [];

  return (data: object, removeData: Array, cb) => {
    waitData = _.assign({}, waitData, data);
    waitRemoveData = waitRemoveData.concat(removeData);
    const currentTime = new Date().getTime();
    if (currentTime - preTime < lazy) {
      clearTimeout(setTime);
    }
    preTime = currentTime;

    const handleAction = (saveDatas, removeDatas) => {
      const saveEndData = _.cloneDeep(saveDatas);
      const removeEndData = removeDatas.slice();

      setTime = setTimeout(() => {
        if (_.isFunction(cb)) {
          cb(saveEndData, [...new Set(removeEndData)]);
        }
        waitRemoveData = [];
        waitData = {};
      }, lazy);
    };

    handleAction(waitData, waitRemoveData);
  };
})();

export const mapObject = (obj, { thizRecord = {}, parentRecord = {} } = {}) =>
  _.chain(obj)
    .mapValues((value, key) => {
      if (_.isObject(value) && _.has(value, 'expression')) {
        const expresson = _.get(value, 'expression');
        return executeExpression(expresson, thizRecord, parentRecord);
      }
      return value; // TODO: 只能是字符串。
    })
    .value();

export const deleteObjectKey = (obj, arr) => {
  const processObj = obj;
  _.each(arr, (key) => {
    delete processObj[key];
  });

  return processObj;
};

// * 删除多余上传参数 __r
export const deleteObject__r = (obj) => {
  const processObj = obj;
  _.each(processObj, (value, key) => {
    _.endsWith(key, '__r') && delete processObj[key];
  });

  return processObj;
};

//* action显示Confirm
export const showConfirm = (action, handleAction, cancelledAction = _.noop) => {
  const { needConfirm, confirmMessage = '确定?' } = IndexDataParser.parseActionLayout(action);
  if (!needConfirm) {
    handleAction(action);
    return;
  }

  Confirm({
    title: '',
    message: confirmMessage,
    onOK: () => {
      handleAction(action);
    },
    onCancel: () => {
      cancelledAction();
    },
  });
};

//* 用于签到时检验返回值地理位置信息
export const checkLocationExact = (params) => {
  const { country, cityCode, city, longitude, latitude } = params;
  const longrg = new RegExp(
    /^(\-|\+)?(((\d|[1-9]\d|1[0-7]\d|0{1,3})\.\d{0,6})|(\d|[1-9]\d|1[0-7]\d|0{1,3})|180\.0{0,6}|180)$/,
  );
  const latreg = new RegExp(/^(\-|\+)?([0-8]?\d{1}\.\d{0,6}|90\.0{0,6}|[0-8]?\d{1}|90)$/);

  if (longrg.test(longitude) && latreg.test(latitude)) {
    return true;
  }

  if (_.isNull(country) && _.isNull(cityCode) && _.isNull(city)) {
    return false;
  }

  return true;
};

/**
 * 目的效果：像 Android 的 windowSoftInputMode = adjustResize 一样能够将底部或者会被键盘遮挡的布局单独顶上去
 * Android 使用自带的 windowSoftInputMode 即可，
 * 且 KeyboardResizeView 双平台表现有差异
 * @param element 任何需要被渲染包裹的元素、内容
 * @param props 用来配置 style 或 contentContainerStyle, 屏蔽掉 behavior (这里不需要，场景很固定)
 * 注：style 很重要，因为被包裹之后，组件的层级结构发生变动，父子之间的布局关系可能会丢失，需要的话自行补充。
 */
export const renderAdjustResizeView = (element, props) =>
  Platform.OS === 'android' ? ( // OS 值有很多，本代码只适用于 Android、iOS 端
    element
  ) : (
    <KeyboardAvoidingView keyboardVerticalOffset={themes.menuHeight} {...props} behavior="position">
      {element}
    </KeyboardAvoidingView>
  );

/**
 * 百度地图 query 参数说明
 * coord_type: 坐标系类型，应该根据后端提供的坐标的类型来决定其值
 * mode: 导航模式
 * sy: 路线优先选择参数，5 为时间短
 * src: 统计来源，格式为：os.companyName.appName
 * 参考链接：https://lbsyun.baidu.com/index.php?title=uri/api/android
 */
export const getLocationMarkerUrl = (latitude: string, longitude: string, title: string) =>
  `baidumap://map/marker?location=${latitude},${longitude}&title=${title}&src=andr.forceclouds.crm`;

export const getDirectionUrl = (latitude: string, longitude: string, mode = 'driving') =>
  `baidumap://map/direction?destination=${latitude},${longitude}&coord_type=bd09ll&mode=${mode}&src=${Platform.OS}.forceclouds.crmpower`;

//* 用于检查是否存在百度地图app
export const baiduMapUrl = `baidumap://map/direction?destination=39.946361,116.415767&coord_type=bd09ll&mode=driving`;

/**
 * 通过 defaultFieldVals 和 record 给 data 做扩展，目前用于给 updateRecord 请求扩展 body
 * @param {object} defaultFieldVals
 * @param {object} record
 * @param {object} data
 */
export function setDefaultFieldVals(defaultFieldVals, record, data) {
  _.forEach(defaultFieldVals, (defaultFieldValLayout) => {
    const defaultVal = defaultFieldValLayout.val;
    const defaultField = defaultFieldValLayout.field;
    if (_.eq(_.get(defaultFieldValLayout, 'field_type'), 'js')) {
      const resultVal = executeExpression(defaultVal, record);
      _.set(data, defaultField, resultVal);
    } else {
      _.set(data, defaultField, defaultVal);
    }
  });
}

/**
 * 检查字符串是否包含 HTML 标签
 * (事实上所有字符串都是 HTML 字符串)
 * @param {String} str
 */
export function isHTML(str: String) {
  return /<[a-z][\s\S]*>/i.test(str);
}

// 转换为 时：分：秒
export function transformSeconds(seconds) {
  if (!seconds) {
    return '00:00';
  }

  const hour = Math.floor(seconds / 3600);
  const minute = Math.floor((seconds % 3600) / 60);
  const second = Math.floor((seconds % 3600) % 60);
  return (
    (hour > 0 ? `${hour < 10 ? '0' + hour : hour}:` : '') +
    `${minute < 10 ? '0' + minute : minute}:${second < 10 ? '0' + second : second}`
  );
}

//设计稿是iPhoneX高度（812），为了在其他设备上看起来间距比较美观，需要round到合适的整数
export function suitableHeightFromIPXHeight(ipxHeight: number): number {
  const DEVICE_HEIGHT = Dimensions.get('window').height;
  let suitableHeight = (ipxHeight / 812) * DEVICE_HEIGHT; //当前设备合适的尺寸
  suitableHeight = Math.round(suitableHeight);
  return suitableHeight;
}

const ISSUE_ICONS = {
  'icon-uniF45D': {
    description: "it has a padding-right style but others don't have",
    solution: {
      textAlign: 'right',
    },
  },
};
/**
 * an amazing solution to resovle specific icon which contains style.
 * @param {*} iconName
 */
export const fixIconStyle = (iconName: string): Object => {
  if (!ISSUE_ICONS[iconName]) return {};
  return ISSUE_ICONS[iconName].solution;
};
