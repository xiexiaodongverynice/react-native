/**
 * * Index列表数据和布局加载
 */

import _ from 'lodash';
import LayoutService from '../services/layoutService';
import Common from '../utils/constants';
import IndexDataParser from './dataParser';
import CallService from './callService';
import HttpRequest from './httpRequest';
import LocalLog from '../utils/LocalLog';

const PERIODIC_START = 'periodic_start';
const PERIODIC_END = 'periodic_end';

export default class IndexService {
  static periodicState = '';
  //* 储存 locallog 回调函数
  static indexStorageEnd;
  //* 储存待发送的header
  static indexHeaderLogs = {};

  static async getIndexLayout({ objectApiName, recordType }) {
    IndexService.periodicState = PERIODIC_START;
    const { uuid, processBegin, storageEnd } = LocalLog.storageBegin();
    const headerLogs = LocalLog.jointLogParams({ uuid, objectApiName, processBegin });
    IndexService.indexHeaderLogs = headerLogs;

    const indexLayout = await LayoutService.getSepcificLayout({
      objectApiName,
      layoutType: Common.layoutTypeIndex,
      recordType,
      token: global.FC_CRM_TOKEN,
      headerLogs,
    });

    if (indexLayout) {
      const layoutApiName = _.get(indexLayout, 'api_name', '');
      IndexService.indexStorageEnd = () => {
        storageEnd({ layoutApiName, objectApiName });
      };
    }

    return indexLayout;
  }

  static async getData(params) {
    const headerLogs = { ...IndexService.indexHeaderLogs };
    const data = await HttpRequest.query({ ...params, headerLogs });
    if (IndexService.periodicState === PERIODIC_START) {
      IndexService.periodicState = PERIODIC_END;
      IndexService.indexHeaderLogs = {};
      _.isFunction(IndexService.indexStorageEnd) && IndexService.indexStorageEnd();
    }
    return data;
  }

  static async getClmProducts(objectDescription) {
    const optionValue = IndexDataParser.getObjectDesFieldOption(
      objectDescription,
      'user_product',
      'product_level',
    );

    const userProductPayload = {
      head: { token: global.FC_CRM_TOKEN },
      body: {
        criterias: [
          {
            field: 'product_level',
            operator: 'in',
            value: optionValue,
          },
          {
            field: 'user_info',
            operator: '==',
            value: ['$$CurrentUserId$$'],
          },
        ],
        objectApiName: 'user_product',
        joiner: 'and',
        orderBy: 'update_time',
        pageNo: 1,
        pageSize: 1000,
      },
    };

    // Product list which is to be selected.
    const productList = await CallService.queryProductList(userProductPayload);
    return productList;
  }
}
