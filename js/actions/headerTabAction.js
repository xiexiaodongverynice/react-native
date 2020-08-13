/*
 Created by Uncle Charlie, 2017/11/23
 */
const CHANGE_HEADER_TAB = 'home/header/change';
const REPORT_TAB = 'Report';
const SCHEDULE_TAB = 'Schedule';

export default function headerTabAction(tab) {
  return {
    type: CHANGE_HEADER_TAB,
    tab,
  };
}

export { CHANGE_HEADER_TAB, REPORT_TAB, SCHEDULE_TAB };
