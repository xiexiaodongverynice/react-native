/**
 *Created by Guanghua on 01/25;
 *@flow
 */

const RECORD_DELETE_START = 'record/delete_start';
const RECORD_DELETE_SUCCESS = 'record/delete_success';
const RECORD_DELETE_FAILED = 'record/delete_failed';

type ExtraType = {
  eventId: number,
};
export function recordDeleteAction(
  token: string,
  objectApiName: string,
  id: any,
  callback,
  extra: ExtraType,
) {
  return {
    type: RECORD_DELETE_START,
    payload: { token, objectApiName, id },
    callback,
    extra,
  };
}

export { RECORD_DELETE_START, RECORD_DELETE_SUCCESS, RECORD_DELETE_FAILED };
