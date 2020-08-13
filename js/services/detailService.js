/**
 * * detail布局，detail状态下数据和布局获取
 *
 */

import _ from 'lodash';
import HttpRequest from './httpRequest';
import Common from '../utils/constants';
import CustomActionService from './customActionService';
import LayoutService from './layoutService';
import LocalLog from '../utils/LocalLog';

export default class DetailService {
  /**
   *
   * * Detail 获取布局和数据
   * @static
   * @param {*} { objectApiName, userId,  recordType ,handleforFail}
   * @memberof DetailService
   */
  static async initDetail({ objectApiName, userId, recordType, handleforFail = _.noop }) {
    const { uuid, processBegin, storageEnd } = LocalLog.storageBegin();
    const headerLogs = LocalLog.jointLogParams({ uuid, objectApiName, processBegin });

    const layoutResult = DetailService.getDetailLayout({
      objectApiName,
      recordType,
      headerLogs,
    });
    const dataResult = DetailService.getDetailData({ objectApiName, userId, headerLogs });
    const detailResult = await Promise.all([layoutResult, dataResult]);
    let detailLayout = detailResult[0];
    const detailData = detailResult[1];
    const detailRecordType = _.get(detailData, 'record_type');

    //* 获取不到布局时，使用当前recordData的record_type再次获取
    if (!detailLayout) {
      const detailRecoreTypeLayout = await DetailService.getDetailLayout({
        objectApiName,
        recordType: detailRecordType,
      });

      if (!detailRecoreTypeLayout) {
        handleforFail();
        return;
      } else {
        detailLayout = detailRecoreTypeLayout;
      }
    }

    const layoutApiName = _.get(detailLayout, 'api_name', '');
    storageEnd({ layoutApiName, objectApiName });
    return { detailLayout, detailData };
  }

  /**
   *
   * * Detail 获取布局
   * @static
   * @param {*} { objectApiName, recordType }
   * @returns
   * @memberof DetailService
   */
  static async getDetailLayout({ objectApiName, recordType, handleforFail, headerLogs = {} }) {
    const layoutResult = await LayoutService.getSepcificLayout({
      objectApiName,
      layoutType: Common.layoutTypeDetail,
      recordType,
      token: global.FC_CRM_TOKEN,
      headerLogs,
    });

    if (_.isFunction(handleforFail) && !layoutResult) {
      handleforFail();
      return;
    }

    return layoutResult;
  }

  /**
   *
   * * Detail 获取数据
   * @static
   * @param {*} { objectApiName, userId }
   * @returns
   * @memberof DetailService
   */
  static async getDetailData({ objectApiName, userId, headerLogs = {} }) {
    const data = await HttpRequest.queryUserBasicInfo({
      objectApiName,
      userId,
      token: global.FC_CRM_TOKEN,
      headerLogs,
    });
    return data;
  }

  //虽然变量名是 userId，并不一定跟user关联，可能跟record关联，或跟event关联。
  static async getDetailData_withoutHeaderLogs({ objectApiName, userId }) {
    const { uuid, processBegin } = LocalLog.storageBegin();
    const headerLogs = LocalLog.jointLogParams({ uuid, objectApiName, processBegin });
    const resultData = await this.getDetailData({ objectApiName, userId, headerLogs });
    return resultData;
  }
}
