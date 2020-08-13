/*
 Created by Uncle Charlie, 2017/11/30
 */
import { all, fork } from 'redux-saga/effects';
import watchCache from './cache';
import watchTabs from './tabs';
import { watchLogout } from './login';
import watchSettings from './settings';
import watchPageLayout from './pageLayout';
import watchChangePassword from './changePassword';
import {
  watchQuery,
  watchQueryDetail,
  watchQueryLoadMore,
  watchQueryMultipleList,
  watchUpdateDetail,
} from './query';
import { watchQueryProduct, watchQueryKeyMessage, watchQueryClm } from './callReport';
import * as WatchRelationship from './relationship';
import watchUserInfo from './userBasicInfo';
import watchInnerQuery from './innerQuery';
import watchRecordUpdate from './recordUpdate';
import watchRecordDelete from './recordDelete';
import watchAddEventAttendee from './event';
import { watchVersionInfo } from './updateVersion';
import {
  watchGetApproval,
  watchSubmitApproval,
  watchCancelApproval,
  watchNodeOperation,
} from './approvalFlow';
import { watchRefrshList } from './list';
import watchNavigation, {
  watchNavigationLoadHistory,
  watchNavigationUpdateHistory,
  watchNavigationDeleteHistory,
} from './navigation';
import {
  watchHomeDataAdd,
  watchHomedataDelete,
  watchHomeDataModify,
  watchQueryHomeList,
  watchQueryHomeSingleData,
} from './newHome';
import { watchQueryListSummury } from './customized';

export default function* rootSaga() {
  yield all([
    // fork(watchLogin),
    fork(watchRefrshList),
    fork(watchLogout),
    fork(watchCache),
    fork(watchTabs),
    fork(watchSettings),
    fork(watchPageLayout),
    fork(watchQuery),
    fork(watchQueryLoadMore),
    // fork(watchFindPassword),
    fork(watchChangePassword),
    fork(watchQueryDetail),
    fork(watchQueryMultipleList),
    fork(watchUpdateDetail),
    fork(WatchRelationship.watchRefreshData),
    fork(WatchRelationship.watchLoadMoreData),
    fork(WatchRelationship.watchLayout),
    fork(watchUserInfo),
    fork(watchVersionInfo),
    fork(watchInnerQuery),
    fork(watchQueryProduct),
    fork(watchQueryKeyMessage),
    fork(watchQueryClm),
    fork(watchRecordUpdate),
    fork(watchRecordDelete),
    fork(watchAddEventAttendee),
    fork(watchNavigation),
    fork(watchNavigationLoadHistory),
    fork(watchNavigationUpdateHistory),
    fork(watchNavigationDeleteHistory),
    fork(watchGetApproval),
    fork(watchSubmitApproval),
    fork(watchCancelApproval),
    fork(watchNodeOperation),
    fork(watchHomeDataAdd),
    fork(watchHomedataDelete),
    fork(watchHomeDataModify),
    fork(watchQueryHomeList),
    fork(watchQueryHomeSingleData),
    fork(watchQueryListSummury),
  ]);
}
