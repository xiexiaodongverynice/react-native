/**
 * * Relation 列表数据和布局加载
 */

import _ from 'lodash';
import LayoutService from '../services/layoutService';
import Common from '../utils/constants';
import HttpRequest from './httpRequest';
import LocalLog from '../utils/LocalLog';

const PERIODIC_START = 'periodic_start';
const PERIODIC_END = 'periodic_end';

export default class RelationService {
  static periodicState = '';
  //* 储存 locallog 回调函数
  static indexStorageEnd;
  //* 储存待发送的header
  static indexHeaderLogs = {};

  static async getRelationLayout({ objectApiName, recordType }) {
    RelationService.periodicState = PERIODIC_START;
    const { uuid, processBegin, storageEnd } = LocalLog.storageBegin();
    const headerLogs = LocalLog.jointLogParams({ uuid, objectApiName, processBegin });
    RelationService.indexHeaderLogs = headerLogs;

    const indexLayout = await LayoutService.getSepcificLayout({
      objectApiName,
      layoutType: Common.layoutTypeRelationLookup,
      recordType,
      token: global.FC_CRM_TOKEN,
      headerLogs,
    });

    if (indexLayout) {
      const layoutApiName = _.get(indexLayout, 'api_name', '');
      RelationService.indexStorageEnd = () => {
        storageEnd({ layoutApiName, objectApiName });
      };
    }
    return indexLayout;
  }

  static async getRelationData(params) {
    const headerLogs = { ...RelationService.indexHeaderLogs };
    const data = await HttpRequest.query({ ...params, headerLogs });
    if (RelationService.periodicState === PERIODIC_START) {
      RelationService.periodicState = PERIODIC_END;
      RelationService.indexHeaderLogs = {};
      _.isFunction(RelationService.indexStorageEnd) && RelationService.indexStorageEnd();
    }
    return data;
  }
}
