/**
 *Created by Guanghua on 01/15;
 */

const QUERY_PRODUCT_START = 'query/query_product_start';
const QUERY_PRODUCT_SUCCESS = 'query/query_product_success';
const QUERY_PRODUCT_FAILED = 'query/query_product_failed';

const QUERY_KEY_MESSAEG_START = 'query/query_key_message_start';
const QUERY_KEY_MESSAEG_SUCCESS = 'query/query_key_message_success';
const QUERY_KEY_MESSAEG_FAILED = 'query/query_key_message_failed';

const QUERY_CLM_START = 'query/query_clm_start';
const QUERY_CLM_SUCCESS = 'query/query_clm_success';
const QUERY_CLM_FAILED = 'query/query_clm_failed';

export function queryProductRecord(payload) {
  return {
    type: QUERY_PRODUCT_START,
    payload,
  };
}

export function queryKeyMessageRecord(payload) {
  return {
    type: QUERY_KEY_MESSAEG_START,
    payload,
  };
}

export function queryClmRecord(payload) {
  return {
    type: QUERY_CLM_START,
    payload,
  };
}

export {
  QUERY_PRODUCT_START,
  QUERY_PRODUCT_FAILED,
  QUERY_PRODUCT_SUCCESS,
  QUERY_KEY_MESSAEG_START,
  QUERY_KEY_MESSAEG_FAILED,
  QUERY_KEY_MESSAEG_SUCCESS,
  QUERY_CLM_START,
  QUERY_CLM_FAILED,
  QUERY_CLM_SUCCESS,
};
