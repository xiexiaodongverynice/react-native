const SUBMIT_APPROVAL = 'APPROVAL/SUBMIT_APPROVAL';
const NODE_OPERATION = 'APPROVAL/NODE_OPERATION';
const CANCEL_APPROVAL = 'APPROVAL/CANCEL_APPROVAL';
const GET_APPROVAL = 'APPROVAL/GET_APPROVAL';
const SUCCESS_APPROVAL = 'APPROVAL/SUCCESS_APPROVAL';
const FAIL_APPROVAL = 'APPROVAL/FAIL_APPROVAL';

/**
 * payload = {
 *   flow_api_name String,
 *   record_id String,
 *   record_api_name array,
 * }
 * @param payload
 * @returns {*}
 */
export function submitApproval(key) {
  return (payload, callback) => ({
    key,
    type: SUBMIT_APPROVAL,
    payload,
    callback,
  });
}

/**
 *
 * @param payload = {
 *   node_id :  long
 *   operation: string
 *   comments:  string
 * }
 *
 * @returns {*}
 */
export function nodeOperation(key) {
  return (payload, callback) => ({
    key,
    type: NODE_OPERATION,
    payload,
    callback,
  });
}

/**
 *
 * @param payload = {
 *  flow_id : long
 *  comments : string
 * }
 * @returns {*}
 */
export function cancelApproval(key) {
  return (payload, callback) => ({
    key,
    type: CANCEL_APPROVAL,
    payload,
    callback,
  });
}

/**
 *
 * @param payload = {
 *  id : long
 * }
 * @returns {*}
 */
export function getApprovalNodesByRecordId(key) {
  return (payload) => ({
    key,
    type: GET_APPROVAL,
    payload,
  });
}

export {
  SUBMIT_APPROVAL,
  CANCEL_APPROVAL,
  NODE_OPERATION,
  GET_APPROVAL,
  SUCCESS_APPROVAL,
  FAIL_APPROVAL,
};
