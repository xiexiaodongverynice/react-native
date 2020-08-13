import _ from 'lodash';
import { executeExpression, executeDetailExp } from '../../../utils/util';

/**
 * 判断section是否显示
 */
export const checkSectionShowable = (fieldOrSection, device = 'phone', page) => {
  /**
   * section是否显示
   */
  let isShow = true;
  /**
   * 指定设备显示配置项
   */
  const showInDevice = fieldOrSection.show_in_device;
  /**
   * 判断是否显示section
   */
  const pages = _.get(showInDevice, device);
  if (pages && _.isArray(pages)) {
    isShow = _.indexOf(pages, page) >= 0;
  }
  return isShow;
};

/**
 *
 * @param {*} section
 * @param {*} page detail | add | edit
 * * 检查show_when
 */
export const checkShowWhen = (section, page) => {
  const pages = _.get(section, 'show_when', []);
  if (_.isEmpty(pages)) {
    return true;
  } else {
    return _.includes(pages, page);
  }
};

/**
 *
 * @param {*} section
 * @param {*} device
 * @param {*} page
 * * 检查show_when和show_in_device
 */
export const checkShowConfig = (section, page, device = 'phone') => {
  const _sectionShow = checkSectionShowable(section, device, page);
  const _showWhen = checkShowWhen(section, page);

  return _showWhen && _sectionShow;
};

/**
 *
 * @param {*} expression  表达式
 * @param {*} t 当前对象
 * @param {*} p 父对象
 * @param {*} r relate对象
 */

export const checkExpression = (expression, t, p, r) => executeDetailExp(expression, t, p, r);

const _getDefaultValue = (fieldDesc, defaultValue) => {
  const type = _.get(fieldDesc, 'type');
  const api_name = _.get(fieldDesc, 'api_name');
  if (type === 'text' || type === 'boolean' || type === 'real_number') {
    return defaultValue;
  }
  if (type === 'select_one') {
    const { options } = fieldDesc;
    if (!_.isArray(options) || options.length === 0) {
      console.warn('select_one options is not arr or empty');
      return undefined;
    }
    const optionIndex = _.findIndex(options, { value: defaultValue });
    if (optionIndex >= 0) {
      const result = {
        apiName: api_name,
        multipleSelect: false,
        renderType: 'select_one',
        selected: [options[optionIndex]],
      };
      return { result, label: options[optionIndex].label, value: defaultValue };
    }
    return undefined;
  }
};

const _checkLayoutValue = (fieldLayout, fieldDesc) => {
  const defaultValue = _.get(fieldLayout, 'default_value');
  if (!_.isNull(defaultValue) && !_.isUndefined(defaultValue)) {
    if (_.isString(defaultValue) || _.isNumber(defaultValue) || _.isBoolean(defaultValue)) {
      return _getDefaultValue(fieldDesc, defaultValue);
    }

    //* 表达式
    if (!_.isEmpty(defaultValue) && _.get(defaultValue, 'expression')) {
      const expression = _.get(defaultValue, 'expression');
      return executeDetailExp(expression);
    }
  }
  return undefined;
};

const _checkDescValue = (fieldLayout, fieldDesc) => {
  const defaultValue = _.get(fieldDesc, 'default_value');
  if (!_.isNull(defaultValue) && !_.isUndefined(defaultValue)) {
    if (_.isString(defaultValue) || _.isNumber(defaultValue) || _.isBoolean(defaultValue)) {
      return _getDefaultValue(fieldDesc, defaultValue);
    }
  }
  return undefined;
};

const _isRequired = (fieldDesc, fieldLayout) => {
  if (_.get(fieldLayout, 'is_required')) return true;
  if (_.get(fieldDesc, 'is_required')) return true;

  //* 当设置依赖后不允许再设置默认值
  if (!_.isEmpty(_.get(fieldDesc, 'dependency', {}))) return true;
  return false;
};

/**
 * *检查新建时，是否有默认值
 * @param fieldDesc 字段描述
 * @param fieldLayout field布局
 */
export const checkConfigDefault = (fieldDesc, fieldLayout) => {
  const layoutDefaultValue = _checkLayoutValue(fieldLayout, fieldDesc);
  if (!_.isNull(layoutDefaultValue) && !_.isUndefined(layoutDefaultValue)) {
    return layoutDefaultValue;
  }

  const descDefaultValue = _checkDescValue(fieldLayout, fieldDesc);
  if (!_.isNull(descDefaultValue) && !_.isUndefined(descDefaultValue)) return descDefaultValue;

  return undefined;
};

/**
 * valid_expression
 */
export const checkValidExpression = ({ layout, thizRecord = {}, parentRecord = {} }) => {
  const { valid_expression } = layout;
  let valid_result = null;
  if (valid_expression) {
    valid_result = executeExpression(valid_expression, thizRecord, parentRecord);
  }
  return valid_result;
};

export const getCustomActionCallbacks = ({ action }) => {
  let { onSuccess, onFailure } = action;
  onSuccess = _.get(onSuccess, 'expression', _.noop);
  onFailure = _.get(onFailure, 'expression', _.noop);
  return {
    onSuccess,
    onFailure,
  };
};

export const checkTip = (field) => {
  const _hint = _.get(field, 'tip.hint', '');
  if (_hint && _.isString(_hint)) {
    return _hint;
  }
  return false;
};

//* 解析赋值field时使用
export const getRecordFields = (fields, itemData = {}, parentData = {}, relateData = {}) => {
  const result = [];
  const recordFields = _.cloneDeep(fields);
  _.each(recordFields, (item) => {
    const defaultValue = _.get(item, 'default_value');
    if (_.isString(defaultValue)) {
      result.push(item);
    } else if (_.isObject(defaultValue) && _.get(defaultValue, 'expression')) {
      item.default_value = executeDetailExp(
        _.get(defaultValue, 'expression'),
        itemData,
        parentData,
        relateData,
      );

      result.push(item);
    }
  });

  return result;
};
