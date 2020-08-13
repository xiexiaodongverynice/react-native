/**
 * Created by xinli on 2017/12/19.
 * @flow
 */
import _ from 'lodash';
import Globals from './Globals';
import assert from './assert0';

export const processCriterias = (criterias: Array<any> = [], itemData = {}, parentData = {}) => {
  const criteriaList = _.map(criterias, (x) => {
    if (is_Criteria_a_CustomAction(x.value)) {
      const criteriaWillReturn = {
        ...x,
        actionName: x.value.action,
        params: process_CustomeAction_params(x.value.params, itemData, parentData),
      };
      if (_.size(criteriaWillReturn.params) === 0) {
        delete criteriaWillReturn.params;
      } else {
        criteriaWillReturn.params = JSON.stringify(criteriaWillReturn.params); //这个字段的类型要求是string！
      }
      delete criteriaWillReturn.value; //不要返回value
      return criteriaWillReturn;
    } else {
      return {
        ...x,
        value: processCriteriaValues(x.value, itemData, parentData),
      };
    }
  });
  // const processed = _.filter(criteriaList, (x) => !_.isEmpty(x.value));
  return criteriaList;
};

const processCriteriaValues = (value: Array<any> = [], itemData = {}, parentData) => {
  if (_.isArray(value)) {
    return value.map((x) => {
      if (_.isObject(x) && x.expression) {
        if (x.expression.indexOf('return') >= 0) {
          // 使用函数
          return new Function('t', 'p', x.expression)(itemData);
        } else {
          // 直接使用eval表达式
          const evaled = eval(x.expression);
          if (typeof evaled === 'function') {
            return evaled();
          } else {
            return evaled;
          }
        }
      } else {
        return x;
      }
    });
  } else if (_.isObject(value) && value.expression) {
    if (value.expression.indexOf('return') >= 0) {
      return [].concat(new Function('t', 'p', value.expression)(itemData, parentData));
    } else {
      let evaled = [];
      try {
        evaled = eval(value.expression);
      } catch (e) {
        // nothing to do
      }
      if (typeof evaled === 'function') {
        return [].concat(evaled());
      } else if (!_.isEmpty(evaled) || _.isNumber(evaled)) {
        return [].concat(evaled);
      }
    }
  } else {
    // 无法解析
    return [];
  }
};

//判断这个criteria是否时custome action，传入 criteria.value
//https://jira.forceclouds.com/browse/CRM-5645
//{
//     "criterias":[
//         {
//             "field":"id",
//             "value":{
//                 "action":"XAreaCustomerIds", //* 当value为对象，且有action属性时条件为customeAction
//                 "params":{
//                     "name":"return t.name",
//                     "status":"return 1"
//                 }
//             },
//             "operator":"in"
//         }
//     ],
//
// }
function is_Criteria_a_CustomAction(value) {
  const reallyIs = _.isObject(value) && _.isString(value.action) && _.size(value.action) > 0;
  return reallyIs;
}

// expression中有return，作为function执行
// 没有function，eval执行
// 如果失败返回fallbackValue
function tryEval(expression, fallbackValue, itemData, parentData) {
  try {
    if (expression.indexOf('return') >= 0) {
      const func = new Function('t', 'p', expression);
      const result = func(itemData, parentData);
      return result;
    } else {
      const evaled = eval(expression);
      if (typeof evaled === 'function') {
        return evaled();
      } else if (!_.isEmpty(evaled) || _.isNumber(evaled)) {
        return evaled;
      }
    }
  } catch (e) {
    return fallbackValue;
  }
}

/**
 *
 * *可以处理任意类型的params。如果不是object，自动转为{}
 * *返回的是object
 * @export
 * @param {*} params {[key]: 'return xxx'}
 * @param {*} itemData t
 * @param {*} parentData p
 * @returns
 */
export function process_CustomeAction_params(params, itemData = {}, parentData = {}) {
  assert(_.isObject(itemData));
  assert(_.isObject(parentData));

  if (!_.isObject(params)) {
    return {};
  }
  //到这里肯定是object了
  const paramsWillReturn = {};
  _.forEach(params, (value, key) => {
    const expression = value; //value中应保存expression
    if (!_.isString(expression)) {
      //忽略非string的value
      console.warn(key + '类型错误。' + JSON.stringify(params));
      return;
    }
    const valueEvaled = tryEval(expression, null, itemData, parentData);
    if (valueEvaled) {
      paramsWillReturn[key] = valueEvaled;
    } else {
      console.warn(`eval ${expression} fail,itemData:`, itemData, 'parentData:', parentData);
    }
  });
  return paramsWillReturn;
}

//* 用于 default_field_val
export const executeDefaultFieldVal = (fieldVal, itemData = {}, parentData = {}) => {
  const fieldObj = {};
  _.each(fieldVal, (item) => {
    const field = _.get(item, 'field');
    const val = _.get(item, 'val');
    const field_type = _.get(item, 'field_type');

    if (_.isUndefined(field_type)) {
      fieldObj[field] = val;
    } else if (field_type === 'js') {
      fieldObj[field] = new Function('t', 'p', val)(itemData, parentData);
    }
  });
  return fieldObj;
};
