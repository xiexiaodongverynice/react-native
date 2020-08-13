/**
 *
 * @flow
 */

import _ from 'lodash';
import { CUSTOMER_SEGMENTATION, default_field_val } from './const';
import { toastError } from '../../../../utils/toast';
import { executeDefaultFieldVal } from '../../../../utils/criteriaUtil';
import I18n from '../../../../i18n';

const validProcess = (processedData, cascadeList) => {
  if (_.isEmpty(cascadeList)) return false;

  let requireValid = false;
  let relationList = {};
  // 判断是否是绿谷新建医生定级功能
  if (_.get(cascadeList, CUSTOMER_SEGMENTATION)) {
    relationList = _.get(cascadeList, CUSTOMER_SEGMENTATION, {});

    if (_.isEmpty(relationList)) {
      toastError(I18n.t('CustomerProductSegmentation.EnterProductsNeedToBeRanked'));
      return true;
    }

    requireValid = _.some(relationList, (items) =>
      _.some(items, (item) => {
        if (_.isUndefined(item) || item === '') {
          toastError(
            I18n.t('CustomerProductSegmentation.EnterNecessaryFieldsOfProductsNeedToBeRanked'),
          );
          return true;
        }
      }),
    );
  } else {
    requireValid = false;
    relationList = cascadeList;
  }

  if (requireValid) {
    return true;
  } else {
    const defaultVal = executeDefaultFieldVal(default_field_val);
    _.each(relationList, (items) => {
      _.each(Object.keys(defaultVal), (key) => {
        items[key] = defaultVal[key];
      });
      const potential = _.get(items, 'potential');
      const support_degree = _.get(items, 'support_degree');
      if (potential && support_degree) {
        items.personal_segmentation = potential + support_degree;
      }
    });
  }

  return false;
};

export { validProcess };
