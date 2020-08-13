/**
 *Created by Guanghua on 01/19;
 */

const RECORD_UPDATE_START = 'record/update_start';
const RECORD_UPDATE_SUCCESS = 'record/update_success';
const RECORD_UPDATE_FAILED = 'record/update_failed';

export function recordUpdateAction(payload, showAlert, callback) {
  return {
    type: RECORD_UPDATE_START,
    payload,
    callback,
    showAlert,
  };
}

export { RECORD_UPDATE_START, RECORD_UPDATE_SUCCESS, RECORD_UPDATE_FAILED };
