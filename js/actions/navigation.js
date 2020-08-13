const NAVIGATION_PUSH_START = 'navigation/push_start';
const NAVIGATION_PUSH_SUCCESS = 'navigation/push_success';
const NAVIGATION_PUSH_FAILED = 'navigation/push_failed';

const NAVIGATION_LOAD_START = 'navigation/load_start';
const NAVIGATION_LOAD_SUCCESS = 'navigation/load_success';
const NAVIGATION_LOAD_FAILED = 'navigation/load_failed';

const NAVIGATION_UPDATE_START = 'navigation/update_start';
const NAVIGATION_UPDATE_SUCCESS = 'navigation/update_success';
const NAVIGATION_UPDATE_FAILED = 'navigation/update_failed';

const NAVIGATION_DELETE_START = 'navigation/delete_start';
const NAVIGATION_DELETE_SUCCESS = 'navigation/delete_success';
const NAVIGATION_DELETE_FAILED = 'navigation/delete_failed';

export const pushNavigationHistory = (screenInfo) => {
  return {
    type: NAVIGATION_PUSH_START,
    payload: {
      screenInfo,
    },
  };
};

export const loadNavigationHistory = (callback) => {
  return {
    type: NAVIGATION_LOAD_START,
    callback,
  };
};

export const updateNavigationHistory = (screenInfo) => {
  return {
    type: NAVIGATION_UPDATE_START,
    payload: {
      screenInfo,
    },
  };
};

export const deleteNavigationHistory = (key) => {
  return {
    type: NAVIGATION_DELETE_START,
    payload: {
      key,
    },
  };
};

export {
  NAVIGATION_PUSH_START,
  NAVIGATION_PUSH_SUCCESS,
  NAVIGATION_PUSH_FAILED,
  NAVIGATION_LOAD_START,
  NAVIGATION_LOAD_SUCCESS,
  NAVIGATION_LOAD_FAILED,
  NAVIGATION_UPDATE_START,
  NAVIGATION_UPDATE_SUCCESS,
  NAVIGATION_UPDATE_FAILED,
  NAVIGATION_DELETE_START,
  NAVIGATION_DELETE_SUCCESS,
  NAVIGATION_DELETE_FAILED,
};
