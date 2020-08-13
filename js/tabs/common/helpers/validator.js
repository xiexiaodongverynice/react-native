/**
 * 用于form表单 自定义验证
 * @flow
 */

import _ from 'lodash';
import assert from '../../../utils/assert0';

const MONEY_VALIDATOR = 'money_validator';

/**
 * * 百分比校验规则
 * @param {*} rule
 * @param {*} val
 * @param {*} callback  总是要返回，正确不含参数，错误则输入错误提示
 */
// $FlowFixMe: add flow annotation when refactoring
const validatorPercentage = (fieldDesc, title, fieldRequired) => (rule, val, callback) => {
  const integer_max_length = _.get(fieldDesc, 'integer_max_length', 2);
  const decimal_max_length = _.get(fieldDesc, 'decimal_max_length', 3);

  if (val === '' || val === 0 || val === null) {
    if (fieldRequired) {
      callback(`请输入正确的${title}`);
      return;
    }
    callback();
  }

  if (_.isNaN(parseFloat(val)) || _.indexOf(val, '.') !== _.lastIndexOf(val, '.')) {
    callback(`请输入正确的${title}`);
    return;
  }

  if (!_.includes(val, '.') && _.size(val) > integer_max_length) {
    callback(`${title}的整数部分长度超出限制，限制位数：${integer_max_length}`);
    return;
  }

  if (_.includes(val, '.')) {
    const splitInput = val.split('.');
    if (_.size(splitInput[0]) > integer_max_length) {
      callback(`${title}的整数部分长度超出限制，限制位数：${integer_max_length}`);
      return;
    }
    if (_.size(splitInput[1]) > decimal_max_length) {
      callback(`${title}的小数位长度超出限制，限制位数：${decimal_max_length}`);
      return;
    }
  }

  callback();
};

type TypeValidatorMoneyParam = {
  val: string,
  fieldRequired: boolean,
  title: string,
  fieldDesc: { type: string, decimal_places?: number },
  callback: (?string) => {},
};

const validatorMoney = (params: TypeValidatorMoneyParam) => {
  const { val, fieldRequired, title, fieldDesc, callback } = params;
  assert(_.isString(val));

  const type = _.get(fieldDesc, 'type');
  //如果type==big_int，decimal_places应为0，所以默认是0
  //如果type是float，decimal_places应由租户配置
  const decimal_places = _.get(fieldDesc, 'decimal_places', 0);
  assert(decimal_places >= 0);
  if (!val && val !== 0) {
    if (fieldRequired) {
      callback(`请输入正确的${title}`);
      return;
    }
    callback();
    return;
  }

  if (_.isNaN(parseFloat(val)) || _.indexOf(val, '.') !== _.lastIndexOf(val, '.')) {
    callback(`请输入正确的${title}`);
    return;
  }

  if (_.includes(val, '.')) {
    const splitInput = val.split('.');
    if (_.size(splitInput[1]) > decimal_places) {
      callback(`${title}的小数位长度超出限制，限制小数位数：${decimal_places}`);
      return;
    }
  }
  callback();
};

type Type_rcFormValidator = {
  type: string,
  fieldDesc: { type: string, decimal_places?: number },
  title: string,
  fieldRequired: boolean,
};
//这是一个hof（Higher order function），传入的参数是用于配置 validator（validator是一个function）。
//validator文档见 https://github.com/yiminghe/async-validator "Rules may be functions that perform validation."

const rcFormValidator = (params: Type_rcFormValidator) => {
  const { type, fieldDesc, title, fieldRequired } = params;
  // $FlowFixMe: async-validator没有提供flow annotation
  const validator = (rule, val, callback, source, options) => {
    if (type === MONEY_VALIDATOR) {
      const paramsToValidator = { val, fieldRequired, title, fieldDesc, callback };
      return validatorMoney(paramsToValidator);
    }
  };
  return validator;
};

export { validatorPercentage, rcFormValidator, MONEY_VALIDATOR };
