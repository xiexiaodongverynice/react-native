/*
 Created by Uncle Charlie, 2017/11/22
 */

import { combineReducers } from 'redux';
// import loginReducer from './login';
import changePasswordReducer from './changePasswordRedurcer';
import cacheReducer from './cache';
import layoutReducer from './pageLayout';
import queryReducer from './query';
import findPasswordReducer from './findPassword';
import optionsReducer from './options';
import relationshipReducer from './relationship';
import userInfoReducer from './userBasicInfo';
import innerReducer from './innerQuery';
import callReportReducer from './callReport';
import versionInfoReducer from './updateVersion';
import recordUpdateReducer from './recordUpdate';
import eventReducer from './event';
import navigationReducer from './navigation';
import approvalFlowReducer from './approvalFlowReducer';
import homeReducer from './newHome';
import listReducer from './listReducer';
import mockReducer from './mockReducer';
import cascadeReducer from './cascadeReducer';
import jmkxIndexSummury from './customized';

export default combineReducers({
  // login: loginReducer,
  changePassword: changePasswordReducer,
  settings: cacheReducer,
  layout: layoutReducer,
  query: queryReducer,
  findpassword: findPasswordReducer,
  options: optionsReducer,
  relationship: relationshipReducer,
  userInfo: userInfoReducer,
  inner: innerReducer,
  versionInfo: versionInfoReducer,
  approvalFlow: approvalFlowReducer,
  callReport: callReportReducer,
  recordUpdate: recordUpdateReducer,
  mock: mockReducer,
  list: listReducer,
  event: eventReducer,
  navigation: navigationReducer,
  home: homeReducer,
  cascade: cascadeReducer,
  jmkxIndex: jmkxIndexSummury,
});
