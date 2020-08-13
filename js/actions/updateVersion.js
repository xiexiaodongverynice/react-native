/*
  Created by Uncle Charlie, 2017/11/22
 */

const UPDATE_VERSION_START = 'update_version_start';
const UPDATE_VERSION_SUCCESS = 'update_version_success';
const UPDATE_VERSION_ERROR = 'update_version_error';
const CLEAR_UPDATE_VERSION = 'clear_update_version';

export function updateDeviceVersion() {
  return {
    type: UPDATE_VERSION_START,
  };
}

export function clearDeviceVersion() {
  return {
    type: CLEAR_UPDATE_VERSION,
  };
}

export { UPDATE_VERSION_START, CLEAR_UPDATE_VERSION, UPDATE_VERSION_SUCCESS, UPDATE_VERSION_ERROR };
