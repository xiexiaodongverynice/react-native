/**
 * Parser some formatter in layout
 * Created by Uncle Charlie, 2018/05/11
 * @flow
 */

import _ from 'lodash';
import IndexDataParser from './dataParser';

function parseFormatter(formatter: string, formatVals: Array<any>) {
  const format = formatter;
  const args = formatVals;
  const result = format.replace(/{(\d+)}/g, (match, number) => {
    return typeof args[number] !== 'undefined' ? args[number] : '';
  });
  return result;
}

function parse(layout: any, data: any, desc: any, apiName: string) {
  if (_.isEmpty(layout)) {
    return null;
  }

  const formatter = _.get(layout, 'formatter');
  const separator = _.get(layout, 'separator');
  const options = _.get(layout, 'options');
  const contents = _.get(layout, 'contents');

  const groups = _.map(contents, (content) => {
    const contentList = Array.prototype.slice.call(content);
    const values = _.map(contentList, (val) => {
      const value = _.get(val, 'value');
      const source = _.get(val, 'source', 0);
      const label = _.get(val, 'label');
      const currentVal = _.get(data, value);

      switch (source) {
        case 0: {
          const parsedValue = IndexDataParser.parseListValue(val, data, desc, apiName);
          const defaultvalue = _.get(val, 'default', '');
          if (parsedValue && parsedValue !== '') {
            return parsedValue;
          } else {
            return defaultvalue;
          }
        }
        case 1: {
          const label = IndexDataParser.parseFieldLabelV2(value, apiName, desc);
          return label;
        }
        case 2: {
          /**
           * 目前`options`还只能处理boolean类型的值。
           * 手机端没有实现i18n，所以目前只能采用label。
           */
          if (_.isEmpty(options)) {
            return null;
          }

          const positive = _.get(options, 'positive');
          const negative = _.get(options, 'negative');

          const dataVal = _.get(data, value);
          return _.isBoolean(dataVal) && dataVal === true
            ? _.get(positive, 'label')
            : _.get(negative, 'label');
        }
      }
    });
    return parseFormatter(formatter, values);
  });
  const result = groups.join(separator || '');
  return result;
}

export default {
  parse,
};
