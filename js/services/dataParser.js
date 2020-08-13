/**
 * Created by Uncle Charlie, 2017/12/17
 * @flow
 */
import _ from 'lodash';
import moment from 'moment';
import I18n from '../i18n';

/**
 * Object description field type
 */
interface ODFieldInfo {
  api_name: string;
  options: any[];
}

/**
 * Whole object descripton wrapper
 */
interface ObjectDescriptionWrapper {
  items: ODFieldInfo[];
}

/**
 * One object description type
 */
interface ObjectDescription {
  fields: ODFieldInfo[];
  api_name: string;
}

/**
 * Layout field type
 */
interface FieldInfo {
  field: string;
  label: ?string;
  target_record_type: ?string;
  render_type: ?string;
}

export default class IndexDataParser {
  static descriptionByApiName = {};

  /**
   *
   * @param rootApiName
   * @param objectDescription
   * @returns {*}
   */
  static getObjectDescByApiName = (
    apiName: string,
    objectDescription: ObjectDescriptionWrapper,
  ) => {
    const rootApiName = getApiName(apiName);
    if (IndexDataParser.descriptionByApiName[rootApiName]) {
      return IndexDataParser.descriptionByApiName[rootApiName];
    }
    const result = _.filter(
      _.get(objectDescription, 'items'),
      (description) => description.api_name === apiName,
    );

    if (result && Array.isArray(result) && result.length > 0) {
      IndexDataParser.descriptionByApiName[rootApiName] = result[0];
      return result[0];
    }

    return null;
  };

  /**
   *
   * *通过获取指定对象的field的options value
   */
  static getObjectDesFieldOption(allDescription: any, objectApiName: string, api_name: string) {
    if (_.isEmpty(allDescription) || !_.isString(objectApiName) || !_.isString(api_name)) {
      return false;
    }

    const currentDesc = IndexDataParser.getObjectDescByApiName(objectApiName, allDescription);

    const optionField = getFieldDesc(currentDesc, api_name);

    if (_.isEmpty(optionField)) return false;

    const option = _.reduce(
      optionField.options,
      (pre, current) => {
        pre.push(current.value);
        return pre;
      },
      [],
    );
    return option;
  }

  /**
   * Get label name of a layout field info.
   * @param layoutFieldInfo - an object which include all information of a field in layout definition.
   * @param objectDescription - object description of a `object_describe_api_name`
   * @returns One of the  object description's fields or null.
   */
  static parserFieldLabel(
    layoutFieldInfo: FieldInfo | string,
    objectDescription: ?ObjectDescription,
  ) {
    if (!layoutFieldInfo || !objectDescription) {
      throw new Error('layout or object description is not valid');
    }

    if (typeof layoutFieldInfo === 'string') {
      const result = _.filter(
        objectDescription.fields,
        (field) => field.api_name === layoutFieldInfo,
      );
      return !_.isEmpty(result) && result[0];
    }

    const result = _.filter(
      objectDescription.fields,
      (field) => field.api_name === layoutFieldInfo.field,
    );

    if (_.isEmpty(result) || !_.isArray(result)) {
      return null;
    }

    //布局中如果有label字段则使用，没有则使用原对象的label
    const labelDesc = _.get(layoutFieldInfo, 'label');
    if (labelDesc) {
      return { ...result[0], label: labelDesc };
    }

    return result[0];
  }

  /**
   * Get object description label string value
   * @param fieldApiName
   * @param objectApiName
   * @param objectDesc
   * @returns label, string value
   */
  static parseFieldLabelV2(
    fieldApiName: string,
    objectApiName: string,
    objectDesc: ObjectDescriptionWrapper,
  ) {
    const currentDesc = IndexDataParser.getObjectDescByApiName(objectApiName, objectDesc);
    const fieldDesc = IndexDataParser.parserFieldLabel(fieldApiName, currentDesc);
    return _.get(fieldDesc, 'label');
  }

  /**
   * Get value of a code in raw data
   * @param layoutFieldInfo
   * @param objectDescription
   * @returns {*}
   */
  static parseFieldValue(
    rootApiName: string,
    layoutFieldInfo: FieldInfo,
    data: any,
    objectDescription: ObjectDescription,
  ) {
    if (_.isEmpty(data)) {
      console.warn('[warn]', layoutFieldInfo.field, '无主数据。');
      return '';
    }
    const renderType = _.get(layoutFieldInfo, 'render_type');
    const fieldObj = getFieldDesc(objectDescription, layoutFieldInfo.field);
    if (layoutFieldInfo.field === 'name') {
      return _.get(data, `${layoutFieldInfo.field}`);
    }
    if (layoutFieldInfo.target_record_type) {
      const value = data[`${layoutFieldInfo.field}__r`];
      if (value) {
        return value.name;
      }
    }

    if (renderType === 'date_time') {
      const formatStr = _.get(layoutFieldInfo, 'date_time_format');
      const dateTimeValue = _.get(data, _.get(fieldObj, 'api_name'));
      if (dateTimeValue) {
        return moment(dateTimeValue).format(formatStr);
      }
      return null;
    } else if (renderType === 'select_one') {
      if (fieldObj) {
        const optionVal = getOptionValue(
          rootApiName,
          fieldObj,
          data[layoutFieldInfo.field],
          renderType,
        );
        return optionVal;
      }
    } else if (renderType === 'select_multiple') {
      if (fieldObj) {
        const optionVal = getOptionValue(
          rootApiName,
          fieldObj,
          data[layoutFieldInfo.field],
          renderType,
        );
        return optionVal;
      }
    } else if (renderType === 'subordinate') {
      // 关联问题 5245
      // 解决方案参考详情渲染获取数据的方法
      // 疑问：不知道为什么当初要用employee__r.name这种取值方式
      // return _.get(data, 'employee__r.name');

      return _.get(data, `${layoutFieldInfo.field}__r.name`);
    } else if (_.get(data, `${layoutFieldInfo.field}__r`)) {
      //* 针对createBy__r 等，renderType 为 text，但是需要从__r中获取name
      return _.get(data, `${layoutFieldInfo.field}__r.name`, data[layoutFieldInfo.field]);
    } else {
      return data[layoutFieldInfo.field];
    }
  }

  static parseFieldKey = () => {};

  /**
   *
   * @param layoutType Index layout's type
   * @param layoutValue Index layout's value
   * @param data Index page data
   * @returns {*}
   */
  static parseListValue = (
    currentLayout: any,
    data: any,
    allDescription: any,
    rootApiName: string,
    needLabels?: any = [],
  ) => {
    const layoutValue = currentLayout.value;
    const layoutType = currentLayout.type;
    const currentDesc = IndexDataParser.getObjectDescByApiName(rootApiName, allDescription);
    let fieldObj = null;
    let is_needLabel = false;
    _.each(needLabels, (need) => {
      if (need === layoutValue) {
        is_needLabel = true;
      }
    });
    if (layoutType === 'icon') {
      return '';
    } else if (layoutType === 'expression') {
      return layoutValue.replace(/\{(.+?)\}/g, (match, re) => {
        fieldObj = getFieldDesc(currentDesc, re);
        let is_show_label = false;
        _.each(needLabels, (need) => {
          if (need === re) {
            is_show_label = true;
          }
        });
        if (fieldObj) {
          const option = IndexDataParser.getListValue(
            rootApiName,
            data,
            currentLayout,
            fieldObj,
            is_show_label,
          );
          return option || '';
        }
        return '';
      });
    } else {
      fieldObj = getFieldDesc(currentDesc, layoutValue);
      if (!fieldObj) {
        return '';
      }

      const result = IndexDataParser.getListValue(
        rootApiName,
        data,
        currentLayout,
        fieldObj,
        is_needLabel,
      );
      return result;
    }
  };

  static getFieldValueV2 = (
    data: any,
    fieldLayout: any,
    fieldApiName: string,
    rootApiName: string,
    rootObjDesc: ObjectDescriptionWrapper,
  ) => {
    const currentDesc = IndexDataParser.getObjectDescByApiName(rootApiName, rootObjDesc);
    const fieldObj = getFieldDesc(currentDesc, fieldApiName);
    return IndexDataParser.getListValue(rootApiName, data, fieldLayout, fieldObj);
  };

  static getListValue = (
    rootApiName: string,
    data: any,
    fieldLayout: any,
    fieldDesc: any,
    is_needLabel?: any = false,
  ) => {
    if (!data || !fieldDesc || !fieldLayout) {
      console.warn('### Data or layout value is not valid');
      return;
    }
    const fieldApiName = _.get(fieldDesc, 'api_name');
    const fieldName = _.get(fieldDesc, 'label');

    if (fieldDesc.type === 'percentage') {
      const tmpValue = data[fieldApiName];
      let formattedValue = '';
      if (_.isNumber(tmpValue)) {
        const decimal_max_length = _.toNumber(_.get(fieldDesc, 'decimal_max_length', 2));
        formattedValue = `${(tmpValue * 100).toFixed(decimal_max_length)}%`;
      }
      return is_needLabel ? `${fieldName}：${formattedValue}` : `${formattedValue}`;
    } else if (fieldDesc.type === 'boolean') {
      if (data[fieldApiName] === 'true' || data[fieldApiName] === true) {
        return is_needLabel ? `${fieldName}：是` : '是';
      } else if (data[fieldApiName] === 'false' || data[fieldApiName] === false) {
        return is_needLabel ? `${fieldName}：否` : '否';
      } else {
        return is_needLabel ? `${fieldName}：` : '';
      }
    } else if (
      fieldDesc.options &&
      (fieldDesc.type === 'select_many' || fieldDesc.type === 'select_one')
    ) {
      const optionVal = getOptionValue(rootApiName, fieldDesc, data[fieldApiName], fieldDesc.type);
      return is_needLabel ? `${fieldName}：${optionVal}` : optionVal;
    } else if (_.get(data, `${fieldApiName}__r`)) {
      // product__r.name || product__r.label
      return is_needLabel
        ? `${fieldName}：${_.get(
            data,
            `${fieldApiName}__r.name`,
            _.get(data, `${fieldApiName}__r.label`),
          )}`
        : _.get(data, `${fieldApiName}__r.name`, _.get(data, `${fieldApiName}__r.label`));
    } else if (fieldDesc.type === 'date_time') {
      const format =
        _.get(fieldLayout, 'date_time_format') ||
        _.get(fieldLayout, 'date_format') ||
        'YYYY-MM-DD HH:mm';

      if (!data[fieldApiName]) return is_needLabel ? `${fieldName}：` : '';
      return is_needLabel
        ? `${fieldName}：${moment(data[fieldApiName]).format(format)}`
        : moment(data[fieldApiName]).format(format);
    } else if (fieldDesc.type === 'time') {
      const format =
        _.get(fieldLayout, 'date_time_format') || _.get(fieldLayout, 'date_format') || 'HH:mm';
      if (!data[fieldApiName]) return is_needLabel ? `${fieldName}：` : '';
      return is_needLabel
        ? `${fieldName}：${moment.utc(data[fieldApiName]).format(format)}`
        : moment.utc(data[fieldApiName]).format(format);
    } else {
      const _value = data[fieldApiName] || _.isNumber(data[fieldApiName]) ? data[fieldApiName] : '';
      return is_needLabel ? `${fieldName}：${_value}` : `${_value}`;
    }
  };

  static parseListLabels = (
    field: any,
    fieldsValue: any,
    allDescription: any,
    objectApiName: any,
  ) => {
    //先尝试到翻译控制台中查找，找不到再到objectDescription中寻找
    const translatedStr = I18n.t_object_options_value(objectApiName, field, fieldsValue);
    if (_.isString(translatedStr)) {
      return translatedStr;
    }

    const { items } = allDescription;
    const statusOptions = _.get(
      _.find(_.get(_.find(items, { api_name: objectApiName }), 'fields'), {
        api_name: field,
      }),
      'options',
    );

    //* 当label 为text，不是select_one
    if (_.isEmpty(statusOptions) && _.isString(fieldsValue)) {
      return fieldsValue;
    }
    const result = _.result(_.find(statusOptions, { value: fieldsValue }), 'label');
    return result;
  };

  static parseActionLayout(actionLayout: any) {
    return {
      needConfirm: _.get(actionLayout, 'need_confirm', false),
      operactionCode: _.toUpper(_.get(actionLayout, 'action')),
      operactionLabel: _.get(actionLayout, 'label'),
      confirmMessage: _.get(actionLayout, 'confirm_message'),
    };
  }
}

export function parseFieldOptions(
  currentLayout: any,
  data: any,
  allDescription: any,
  rootApiName: string,
) {
  const layoutValue = currentLayout.value;
  const layoutType = currentLayout.type;
  const currentDesc = IndexDataParser.getObjectDescByApiName(rootApiName, allDescription);
  const fieldObj = getFieldDesc(currentDesc, layoutValue);

  return fieldObj ? fieldObj.options : null;
}

function getApiName(ApiName: string) {
  return `apiName_${ApiName}_${global.FC_CRM_USERID}`;
}

/**
 * Get field object description
 * @param {*} objectDesc Current object description
 * @param {*} optionName Field api name
 */
const getFieldDesc = (
  objectDesc: ?ObjectDescription,
  optionName: string,
): ?{ options: Array<any> } => {
  if (!objectDesc || !optionName) {
    return null;
  }

  const result = _.filter(objectDesc.fields, (filed) => filed.api_name === optionName);
  if (!result || !Array.isArray(result) || result.length <= 0) {
    return null;
  }
  return result[0];
};

const getOptionValue = (
  rootApiName: string,
  fieldObj: ODFieldInfo,
  optionValue: any,
  renderType: String,
) => {
  if (!fieldObj || !optionValue || !renderType) {
    return '';
  }
  if (renderType === 'select_many') {
    if (!Array.isArray(optionValue) || optionValue.length <= 0) {
      return '';
    }
    const realOptionLable = [];
    const realOptions = _.filter(fieldObj.options, (op) => _.includes(optionValue, op.value));
    _.map(realOptions, (item, index) => {
      realOptionLable.push(item.label);
    });
    return realOptionLable;
  } else {
    if (_.isEmpty(fieldObj.options) && optionValue) {
      // 问题描述 详情页产品有值进入编辑页产品没有值
      // 关联 SelectOneView组件 placeholderValue fetchData
      return optionValue;
    }

    //先到翻译控制台查一下
    const translatedLabel = I18n.t_object_options_value(
      rootApiName,
      fieldObj.api_name,
      optionValue,
    );
    if (_.isString(translatedLabel)) {
      return translatedLabel;
    }

    const result = _.filter(fieldObj.options, (op) => op.value === optionValue);
    if (!result || !Array.isArray(result) || result.length <= 0) {
      return '';
    }
    return result[0].label;
  }
};

const CONDITION_CONFIG = [
  {
    type: ['text', 'long_text', 'relation', 'select_many'],
    options: [
      {
        label: '包含',
        value: 'contains',
      },
      {
        label: '等于',
        value: '==',
      },
    ],
  },
  {
    type: ['date', 'date_time'],
    options: [
      {
        label: '早于',
        value: '<',
      },
      {
        label: '晚于',
        value: '>',
      },
    ],
  },
  {
    type: ['select_one'],
    options: [
      {
        label: '等于',
        value: '==',
      },
      {
        label: '不等于',
        value: '<>',
      },
    ],
  },
  {
    type: ['boolean', 'default'],
    options: [
      {
        label: '等于',
        value: '==',
      },
    ],
  },
  {
    type: ['real_number'],
    options: [
      {
        label: '等于',
        value: '==',
      },
      {
        label: '大于',
        value: '>',
      },
      {
        label: '小于',
        value: '<',
      },
    ],
  },
];

export { CONDITION_CONFIG };
