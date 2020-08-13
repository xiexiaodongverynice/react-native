import _ from 'lodash';
import * as Util from '../../utils/util';
import { toastError } from '../../utils/toast';
import CustomActionService from '../../services/customActionService';

export default class CreateCustomerAction {
  static checkLastSegmentationHandle({ action, detailData, initData, record, callback }) {
    Util.showConfirm(action, () => {
      //* 带出上次定级信息

      if (!_.get(record, 'product')) return toastError('请填写定级产品信息');
      CustomActionService.executeAction({
        objectApiName: 'segmentation_history',
        action: action.action,
        token: global.FC_CRM_TOKEN,
        params: {
          productId: _.get(record, 'product'),
          customerId: _.get(initData, 'customer', _.get(detailData, 'customer')),
        },
      }).then((res) => {
        if (_.isEmpty(_.get(res, 'body'))) {
          return toastError('未查询到符合的历史定级信息。');
        }
        callback(_.get(res, 'body'));
      });
    });
  }

  //* 基石定制需求，新建活动保存后跳转添加参会人列表
  static async saveAndNavtoAttendeePage({
    action,
    validFormData,
    objectApiName,
    record,
    navigation,
    refreshIndex,
    addAttendee,
  }) {
    try {
      const values = await validFormData(action);
      const validValues = _.omitBy(values, (v) => v == null);
      const params = _.cloneDeep(record);
      if (params) {
        for (const x in params) {
          if (typeof params[x] === 'object' && _.isEmpty(params[x])) {
            params[x] === null;
            if (validValues[x]) {
              params[x] = validValues[x];
            }
          }
        }
      }

      const refQueryData = await CustomActionService.resolveAction({
        objectApiName,
        action: action.action,
        token: global.FC_CRM_TOKEN,
        params,
      });

      if (!_.isEmpty(refQueryData)) {
        refreshIndex({ updateData: refQueryData, apiName: objectApiName });
        const {
          refObjectApiName,
          refRecordType,
          targetObjectApiName,
          targetRecordType,
          initCriterias = [],
          parentId,
          detailObjectApiName,
          detailRecordType,
        } = refQueryData;

        navigation.replace('Relation', {
          apiName: refObjectApiName,
          targetRecordType: refRecordType,
          fieldLayout: { target_filter_criterias: { criterias: initCriterias } },
          related: true,
          otherGoBack: true,
          callback: this.addAttendeeHandle({
            parentId,
            addAttendee,
            targetObjectApiName,
            targetRecordType,
            detailObjectApiName,
            detailRecordType,
          }),
        });
      }
    } catch (e) {
      console.warn('saveAndNavtoAttendeePage error', e);
    }
  }

  //* 添加参会人
  static addAttendeeHandle = ({
    parentId,
    addAttendee,
    targetObjectApiName,
    targetRecordType,
    detailObjectApiName,
    detailRecordType,
  }) => (selected, navigation) => {
    const composeSelected = _.map(selected, (item) => {
      const selectedRecord = {
        name: item.name,
        customer: item.id,
        record_type: targetRecordType,
        event: parentId,
        is_walkin_attendee: false,
        object_describe_name: targetObjectApiName,
      };

      if (_.get(item, 'parent_id__r.name', false)) {
        _.set(selectedRecord, 'attendee_organization', item.parent_id__r.name);
      }
      if (_.get(item, 'department', false)) {
        _.set(selectedRecord, 'attendee_department', item.department);
      }
      if (_.get(item, 'admin_title', false)) {
        _.set(selectedRecord, 'attendee_title', item.admin_title);
      }
      return selectedRecord;
    });

    const actionParam = {
      objectApiName: targetObjectApiName,
      token: global.FC_CRM_TOKEN,
      data: composeSelected,
      eventId: parentId,
    };

    addAttendee(actionParam);
    //* 添加参会人后跳转到详情页
    navigation.replace('Detail', {
      navParam: {
        objectApiName: detailObjectApiName || 'event',
        record_type: detailRecordType || 'master',
        id: parentId,
      },
    });
  };
}
