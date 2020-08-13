/**
 * * 拜访产品,媒体信息，关键信息
 * @flow
 */
import _ from 'lodash';
import RecordService from './recordService';
import HttpRequest from '../services/httpRequest';

export default {
  async queryProductList(payload: any): ?Array<any> {
    const productList = await RecordService.queryRecordListService(payload);
    return productList && productList.result;
  },

  async queryKeyMessageList(payload: any): ?Array<any> {
    const keyMessageList = await RecordService.queryRecordListService(payload);
    return keyMessageList && keyMessageList.result;
  },

  async queryProductAndKeyMessages({ prodLoad, messageLoad }) {
    const self = this;
    const [prodList, msgList] = [
      await self.queryProductList(prodLoad),
      await self.queryKeyMessageList(messageLoad),
    ];
    return [prodList, msgList];
  },

  async updateCall({ objectApiName, userId, token, updateData }) {
    const result = await HttpRequest.updateSingleRecord({
      objectApiName,
      userId,
      token,
      updateData,
    });
    return result;
  },

  //* 获取拜访下的产品
  async getCallProductList(parentCallId) {
    const productPayload = {
      head: { token: global.FC_CRM_TOKEN },
      body: {
        criterias: [{ field: 'call', operator: '==', value: [parentCallId] }],
        objectApiName: 'call_product',
        joiner: 'and',
        orderBy: 'create_time',
        pageNo: 1,
        pageSize: 1000,
      },
    };

    const productList = await RecordService.queryRecordListService(productPayload);
    return productList && productList.result;
  },

  // * 获取拜访下的关键信息
  async getCallKeyMessage(parentCallId) {
    const keyMessagePayload = {
      head: { token: global.FC_CRM_TOKEN },
      body: {
        criterias: [
          {
            field: 'call',
            operator: '==',
            value: [parentCallId],
          },
        ],
        joiner: 'and',
        orderBy: 'create_time',
        order: 'asc',
        objectApiName: 'call_key_message',
        pageSize: 100,
        pageNo: 1,
      },
    };
    const keyMessageList = await RecordService.queryRecordListService(keyMessagePayload);
    return keyMessageList && keyMessageList.result;
  },

  //* 获取产品下所有关键信息
  async getProductKeymensage(productList) {
    const keyMessagePayload = {
      head: { token: global.FC_CRM_TOKEN },
      body: {
        criterias: [
          { field: 'record_type', operator: 'in', value: ['master'] },
          {
            field: 'product',
            operator: 'in',
            value: [productList],
          },
          {
            field: 'is_active',
            operator: '==',
            value: [true],
          },
        ],
        joiner: 'and',
        objectApiName: 'key_message',
        pageNo: 1,
        pageSize: 1000,
      },
    };

    const keyMessageList = await RecordService.queryRecordListService(keyMessagePayload);
    return keyMessageList && keyMessageList.result;
  },

  async getProductClm(productList) {
    const payload = {
      head: { token: global.FC_CRM_TOKEN },
      body: {
        criterias: [
          {
            field: 'status',
            operator: '==',
            value: [1],
          },
          {
            field: 'product',
            operator: 'in',
            value: [productList],
          },
        ],
        objectApiName: 'clm_presentation',
        joiner: 'and',
        orderBy: 'create_time',
        order: 'asc',
        pageNo: 1,
        pageSize: 100,
      },
    };
    const clm = await RecordService.queryRecordListService(payload);
    return clm && clm.result;
  },

  async getProductFolder(productList) {
    const prodList = [];
    _.map(productList, (ite, index) => {
      prodList.push(ite + '');
    });
    const payload = {
      head: { token: global.FC_CRM_TOKEN },
      body: {
        criterias: [
          {
            field: 'status',
            operator: '==',
            value: [1],
          },
          // {
          //   field: 'product',
          //   operator: 'contains',
          //   value: prodList,
          // },
        ],
        territoryCriterias: [],
        joiner: 'and',
        orderBy: 'create_time',
        order: 'asc',
        objectApiName: 'folder',
        pageNo: 1,
        pageSize: 10000,
      },
    };
    const folder = await RecordService.queryRecordListService(payload);
    return folder && folder.result;
  },

  async getProductFolderRelation(productList) {
    const payload = {
      head: { token: global.FC_CRM_TOKEN },
      body: {
        criterias: [],
        objectApiName: 'clm_folder',
        joiner: 'and',
        orderBy: 'create_time',
        order: 'asc',
        pageNo: 1,
        pageSize: 100,
      },
    };
    const folderRelation = await RecordService.queryRecordListService(payload);
    return folderRelation && folderRelation.result;
  },

  //* 获取拜访下已有媒体信息
  async getCallClm(parentCallId) {
    const payload = {
      token: global.FC_CRM_TOKEN,
      criteria: [
        {
          field: 'call',
          operator: '==',
          value: [parentCallId],
        },
      ],
      joiner: 'and',
      objectApiName: 'survey_feedback',
      order: 'asc',
      orderBy: 'create_time',
      pageNo: 1,
      pageSize: 100,
    };
    const clm = await HttpRequest.query(payload);
    return clm && clm.result;
  },

  async getPreClm(clmParams) {
    const requestPreMediaList = {
      token: global.FC_CRM_TOKEN,
      pageSize: 100,
      pageNo: 1,
      joiner: 'and',
      order: 'desc',
      objectApiName: clmParams.objectApiName,
      orderBy: 'create_time',
      criteria: [
        {
          field: 'id',
          operator: '==',
          value: [clmParams.id],
        },
      ],
    };

    const preMediaList = await HttpRequest.query(requestPreMediaList);
    return preMediaList && preMediaList.result;
  },
};
