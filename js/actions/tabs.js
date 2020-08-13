/**
 * Create by Uncle Charlie, 2017/12/10
 */

const TABS_LOAD_START = 'tabs/load_start';
const TABS_LOAD_SUCCESS = 'tabs/load_success';
const TABS_LOAD_FAILED = 'tabs/load_failed';

export default function tabsAction(token) {
  return {
    type: TABS_LOAD_START,
    token,
  };
}

export { TABS_LOAD_START, TABS_LOAD_FAILED, TABS_LOAD_SUCCESS };
