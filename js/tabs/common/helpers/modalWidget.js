import _ from 'lodash';
import { executeExpression } from '../../../utils/util';

export const getSrc = (src: any) => {
  if (_.isObject(src) && _.has(src, 'expression')) {
    const expression = _.get(src, 'expression', '');
    src = executeExpression(expression, {}, {});
  }
  return src;
};
