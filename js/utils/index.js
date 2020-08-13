/**
 * Util stuff
 * @flow
 */

import lodash from 'lodash';
import moment from 'moment';

// 连字符转驼峰
String.prototype.hyphenToHump = function() {
  return this.replace(/-(\w)/g, (...args) => {
    return args[1].toUpperCase();
  });
};

// 驼峰转连字符
String.prototype.humpToHyphen = function() {
  return this.replace(/([A-Z])/g, '-$1').toLowerCase();
};

// 日期格式化
// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
// 例子：
// (new Date()).format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
Date.prototype.format = function(format) {
  const o = {
    'y+': this.getYear(),
    'Y+': this.getYear(),
    'M+': this.getMonth() + 1,
    'D+': this.getDate(),
    'd+': this.getDate(),
    'h+': this.getHours(),
    'H+': this.getHours(),
    'm+': this.getMinutes(),
    's+': this.getSeconds(),
    'q+': Math.floor((this.getMonth() + 3) / 3),
    S: this.getMilliseconds(),
  };
  if (/(y+)/.test(format)) {
    format = format.replace(RegExp.$1, `${this.getFullYear()}`.substr(4 - RegExp.$1.length));
  }
  for (const k in o) {
    if (new RegExp(`(${k})`).test(format)) {
      format = format.replace(
        RegExp.$1,
        RegExp.$1.length === 1 ? o[k] : `00${o[k]}`.substr(`${o[k]}`.length),
      );
    }
  }
  return format;
};
/** * 对Date的扩展，将 Date 转化为指定格式的String * 月(M)、日(d)、12小时(h)、24小时(H)、分(m)、秒(s)、周(E)、季度(q)
 可以用 1-2 个占位符 * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) * eg: * (new
 Date()).pattern("yyyy-MM-dd hh:mm:ss.S")==> 2006-07-02 08:09:04.423
 * (new Date()).pattern("yyyy-MM-dd E HH:mm:ss") ==> 2009-03-10 二 20:09:04
 * (new Date()).pattern("yyyy-MM-dd EE hh:mm:ss") ==> 2009-03-10 周二 08:09:04
 * (new Date()).pattern("yyyy-MM-dd EEE hh:mm:ss") ==> 2009-03-10 星期二 08:09:04
 * (new Date()).pattern("yyyy-M-d h:m:s.S") ==> 2006-7-2 8:9:4.18
 */
Date.prototype.pattern = function(fmt) {
  const o = {
    'M+': this.getMonth() + 1, // 月份
    'd+': this.getDate(), // 日
    'h+': this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, // 小时
    'H+': this.getHours(), // 小时
    'm+': this.getMinutes(), // 分
    's+': this.getSeconds(), // 秒
    'q+': Math.floor((this.getMonth() + 3) / 3), // 季度
    S: this.getMilliseconds(), // 毫秒
  };
  const week = {
    0: '/u65e5',
    1: '/u4e00',
    2: '/u4e8c',
    3: '/u4e09',
    4: '/u56db',
    5: '/u4e94',
    6: '/u516d',
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, `${this.getFullYear()}`.substr(4 - RegExp.$1.length));
  }
  if (/(E+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      (RegExp.$1.length > 1 ? (RegExp.$1.length > 2 ? '/u661f/u671f' : '/u5468') : '') +
        week[`${this.getDay()}`],
    );
  }
  for (const k in o) {
    if (new RegExp(`(${k})`).test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : `00${o[k]}`.substr(`${o[k]}`.length),
      );
    }
  }
  return fmt;
};

/**
 * @param   {String}
 * @return  {String}
 */
const queryURL = (name) => {
  const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`, 'i');
  const r = window.location.search.substr(1).match(reg);
  if (r != null) return decodeURI(r[2]);
  return null;
};

/**
 * 数组内查询
 * @param   {array}      array
 * @param   {String}    id
 * @param   {String}    keyAlias
 * @return  {Array}
 */
const queryArray = (array, key, keyAlias = 'key') => {
  if (!(array instanceof Array)) {
    return null;
  }
  const item = array.filter((_) => _[keyAlias] === key);
  if (item.length) {
    return item[0];
  }
  return null;
};

/**
 * 数组格式转树状结构
 * @param   {array}     array
 * @param   {String}    id
 * @param   {String}    pid
 * @param   {String}    children
 * @return  {Array}
 */
const arrayToTree = (array, id = 'id', pid = 'pid', children = 'children') => {
  const data = lodash.cloneDeep(array);
  const result = [];
  const hash = {};
  data.forEach((item, index) => {
    hash[data[index][id]] = data[index];
  });

  data.forEach((item) => {
    const hashVP = hash[item[pid]];
    if (hashVP) {
      !hashVP[children] && (hashVP[children] = []);
      hashVP[children].push(item);
    } else {
      result.push(item);
    }
  });

  return result;
};

const callAnotherFunc = (fnFunction, vArgument, pArgument = {}) => {
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
};

const isTimeRange = (beginTime, endTime, compareTime) => {
  const strb = beginTime.split(':');
  if (strb.length !== 2) {
    return false;
  }

  const stre = endTime.split(':');
  if (stre.length !== 2) {
    return false;
  }

  const strn = compareTime.split(':');
  if (stre.length !== 2) {
    return false;
  }
  const b = new Date();
  const e = new Date();
  const n = new Date();

  b.setHours(strb[0]);
  b.setMinutes(strb[1]);
  e.setHours(stre[0]);
  e.setMinutes(stre[1]);
  n.setHours(strn[0]);
  n.setMinutes(strn[1]);

  if (n.getTime() - b.getTime() > 0 && n.getTime() - e.getTime() < 0) {
    return true;
  } else {
    console.error(`当前时间是：${n.getHours()}:${n.getMinutes()}，不在该时间范围内！`);
    return false;
  }
};

function dateParse(dateString) {
  const SEPARATOR_BAR = '-';
  const SEPARATOR_SLASH = '/';
  const SEPARATOR_DOT = '.';
  let dateArray;
  if (dateString.indexOf(SEPARATOR_BAR) > -1) {
    dateArray = dateString.split(SEPARATOR_BAR);
  } else if (dateString.indexOf(SEPARATOR_SLASH) > -1) {
    dateArray = dateString.split(SEPARATOR_SLASH);
  } else {
    dateArray = dateString.split(SEPARATOR_DOT);
  }
  return new Date(dateArray[0], dateArray[1] - 1, dateArray[2]);
}

/**
 * 日期比较大小
 * compareDateString大于dateString，返回1；
 * 等于返回0；
 * compareDateString小于dateString，返回-1
 * @param dateString 日期
 * @param compareDateString 比较的日期
 */
function dateCompare(dateString, compareDateString) {
  if (_.isEmpty(dateString)) {
    alert('dateString不能为空');
    return;
  }
  if (_.isEmpty(compareDateString)) {
    alert('compareDateString不能为空');
    return;
  }
  const dateTime = dateParse(dateString).getTime();
  const compareDateTime = dateParse(compareDateString).getTime();
  if (compareDateTime > dateTime) {
    return 1;
  } else if (compareDateTime === dateTime) {
    return 0;
  } else {
    return -1;
  }
}

/**
 * 判断日期是否在区间内，在区间内返回true，否返回false
 * @param dateString 日期字符串
 * @param startDateString 区间开始日期字符串
 * @param endDateString 区间结束日期字符串
 * @returns {Number}
 */
function isDateBetween(dateString, startDateString, endDateString) {
  if (_.isEmpty(dateString)) {
    alert('dateString不能为空');
    return;
  }
  if (_.isEmpty(startDateString)) {
    alert('startDateString不能为空');
    return;
  }
  if (_.isEmpty(endDateString)) {
    alert('endDateString不能为空');
    return;
  }
  let flag = false;
  const startFlag = dateCompare(dateString, startDateString) < 1;
  const endFlag = dateCompare(dateString, endDateString) > -1;
  if (startFlag && endFlag) {
    flag = true;
  }
  return flag;
}

/**
 * 判断日期区间[startDateCompareString,endDateCompareString]是否完全在别的日期区间内[startDateString,endDateString]
 * 即[startDateString,endDateString]区间是否完全包含了[startDateCompareString,endDateCompareString]区间
 * 在区间内返回true，否返回false
 * @param startDateString 新选择的开始日期，如输入框的开始日期
 * @param endDateString 新选择的结束日期，如输入框的结束日期
 * @param startDateCompareString 比较的开始日期
 * @param endDateCompareString 比较的结束日期
 * @returns {Boolean}
 */
function isDatesBetween(
  startDateString,
  endDateString,
  startDateCompareString,
  endDateCompareString,
) {
  if (_.isEmpty(startDateString)) {
    alert('startDateString不能为空');
    return;
  }
  if (_.isEmpty(endDateString)) {
    alert('endDateString不能为空');
    return;
  }
  if (_.isEmpty(startDateCompareString)) {
    alert('startDateCompareString不能为空');
    return;
  }
  if (_.isEmpty(endDateCompareString)) {
    alert('endDateCompareString不能为空');
    return;
  }
  let flag = false;
  const startFlag = dateCompare(startDateCompareString, startDateString) < 1;
  const endFlag = dateCompare(endDateCompareString, endDateString) > -1;
  if (startFlag && endFlag) {
    flag = true;
  }
  return flag;
}

function fc_combineTime(time, defaultDate) {
  const dDate = moment(new Date().setHours(0, 0, 0, 0)).format('x');
  let convertTime = `${dDate} ${time}`;
  if (defaultDate !== undefined) {
    const handlerTime = moment(defaultDate).format('YYYY-MM-DD');
    convertTime = `${handlerTime} ${time}`;
  }
  return `${moment(convertTime).valueOf()}`;
}

module.exports = {
  arrayToTree,
  callAnotherFunc,
  isDateBetween,
  isDatesBetween,
  isTimeRange,
  fc_combineTime,
  // callBackDeal,
};
