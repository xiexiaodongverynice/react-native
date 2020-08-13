/**
 * * 副作用验证
 * @flow
 */

import _ from 'lodash';
import { crmTenant_isShgvp } from '../../utils/const';
import { validProcess } from '../customized/shgvp/CustomerProductSegmentation/helper';

const CreateSideEffect = (processedData, cascadeList) => {
  if (crmTenant_isShgvp()) {
    return validProcess(processedData, cascadeList);
  }

  return false;
};

export { CreateSideEffect };
