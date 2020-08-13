import React from 'react';
import _ from 'lodash';
import CallService from '../../../services/callService';
import * as Util from '../../../utils/util';
import { processCriterias } from '../../../utils/criteriaUtil';

async function selectClmProduct(userProduct, defaultCriterias, data) {
  const clm_filter_criterias = _.get(global.CRM_SETTINGS, 'clm_filter_criterias');
  if (!clm_filter_criterias) return null;

  //* 1为用户产品 2为客户产品 3为用户与客户产品的交际
  if (clm_filter_criterias === '1') {
    return userProduct;
  } else {
    const customerProduct = await queryProduct('customer_product', defaultCriterias, data);
    if (clm_filter_criterias === '2') {
      return customerProduct;
    } else if (clm_filter_criterias === '3') {
      const mergeClmProduct = _.filter(userProduct, (u) =>
        _.some(customerProduct, (c) => {
          if (_.get(u, 'product') && _.get(c, 'product')) {
            return _.get(u, 'product') === _.get(c, 'product');
          }
        }),
      );
      return mergeClmProduct;
    }
  }
}

async function queryProduct(objectApiName, defaultCriterias = [], data) {
  if (!objectApiName || !_.isString(objectApiName)) return null;

  let criteria = [];
  if (!_.isEmpty(defaultCriterias)) {
    if (objectApiName === 'user_product') {
      criteria = defaultCriterias.filter((e) => e.field === 'user_info');
    } else if (objectApiName === 'customer_product') {
      criteria = defaultCriterias.filter((e) => e.field === 'customer');
      if (_.get(criteria, '[0]value.expression')) {
        const value = Util.executeExpression(_.get(criteria, '[0]value.expression'), data);
        criteria[0].value = [value];
      }
    }
  }
  const userProductPayload = {
    head: { token: global.FC_CRM_TOKEN },
    body: {
      criterias: criteria,
      objectApiName,
      joiner: 'and',
      orderBy: 'update_time',
      pageNo: 1,
      pageSize: 1000,
    },
  };
  // Product list which is to be selected.
  const productList = await CallService.queryProductList(userProductPayload);
  return productList;
}

/**
 *
 ** 用于产品选择扩展
 * @param {*} objectApiName
 * @param {*} [defaultCriterias=[]]
 * @param {*} data
 * @returns
 */
async function queryClmProduct(objectApiName, defaultCriterias = [], parentData) {
  if (!objectApiName || !_.isString(objectApiName)) return null;

  let criteria = [];
  if (!_.isEmpty(defaultCriterias)) {
    criteria = processCriterias(defaultCriterias, {}, parentData);
  }
  const userProductPayload = {
    head: { token: global.FC_CRM_TOKEN },
    body: {
      criterias: criteria,
      objectApiName,
      joiner: 'and',
      orderBy: 'update_time',
      pageNo: 1,
      pageSize: 1000,
    },
  };
  // Product list which is to be selected.
  const productList = await CallService.queryProductList(userProductPayload);
  return productList;
}

export { selectClmProduct, queryProduct, queryClmProduct };
