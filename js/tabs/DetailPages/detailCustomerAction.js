/**
 * @flow
 */

import _ from 'lodash';
import { toastSuccess, toastWaring, toastError, toastDefault } from '../../utils/toast';
import { getCustomActionCallbacks } from '../common/helpers/recordHelper';
import CustomActionService from '../../services/customActionService';
import WorkflowAction from '../../components/workFlow/workflowAction';
import {
  WORK_FLOW_ACTION_SUBMIT,
  WORK_FLOW_ACTION_RESUBMIT,
  WORK_FLOW_ACTION_HISTORY,
  WORK_FLOW_PROCESS_ACTION_CONFIG,
} from '../../components/workFlow/common';
import { process_CustomeAction_params } from '../../utils/criteriaUtil';

export default class DetailCustomerAction {
  static callCustomerAction({
    actionLayout,
    screenInfo,
    navigation,
    detailData,
    callBackAction,
    editAction,
    deleteAction,
    refreshDetail,
  }) {
    const {
      state: {
        params: { navParam },
      },
    } = navigation;

    const objectApiName =
      _.get(navParam, 'objectApiName') ||
      _.get(navParam, 'object_describe_api_name') ||
      _.get(screenInfo, 'objectApiName');

    const { action_code } = actionLayout;

    const customOnsuccessCategory = {
      callBackAction,
      editAction,
      deleteAction,
      refreshDetail,
    };

    if (_.startsWith(action_code, 'workflow_')) {
      this.workFlowCustomerAction({
        navigation,
        detailData,
        actionLayout,
        objectApiName,
        refreshDetail,
      });
    } else if (!_.isEmpty(_.get(actionLayout, 'show_modal'))) {
      //* 自定义按钮中show_modal类型
      this.relationCustomAction({ actionLayout, customOnsuccessCategory, navigation, detailData });
    } else {
      this.standardCustomerAction({
        actionLayout,
        objectApiName,
        detailData,
        customOnsuccessCategory,
      });
    }
  }

  //* 跳转到relation页，将选中数据的id作为customAction的ids中上传
  static async relationCustomAction({
    actionLayout,
    customOnsuccessCategory,
    navigation,
    detailData,
  }) {
    const showModalLayout = _.get(actionLayout, 'show_modal', {});
    const layoutRecordType = _.get(actionLayout, 'target_layout_record_type', 'master');
    const objectApiName = _.get(actionLayout, 'object_describe_api_name');

    const customOnsuccessCallback = this.customOnsuccessHandler({
      customOnsuccessCategory,
      actionLayout,
    });

    const parseParams = process_CustomeAction_params(_.get(actionLayout, 'params'), {}, detailData);

    //* 是否支持多选
    const multiple_select = _.get(showModalLayout, 'multiple_select', true);
    const multipleSelectParams = multiple_select
      ? { related: true }
      : { hiddenClear: true, multipleSelect: false };

    navigation.navigate('Relation', {
      targetRecordType: layoutRecordType,
      fieldLayout: showModalLayout,
      record: detailData,
      apiName: objectApiName,
      ...multipleSelectParams,
      callback: (selecteds) => {
        CustomActionService.postCustomeShowModal({
          //* 三元表达式的判断是因为多选是直接将选中的数据传递给callback，而单选还包装了一层selected
          selecteds: !_.isEmpty(_.get(selecteds, 'selected')) ? selecteds.selected : selecteds,
          actionLayout,
          customOnsuccessCallback,
          parseParams,
        });
      },
    });
  }

  static async standardCustomerAction({
    actionLayout,

    detailData,
    objectApiName,
    customOnsuccessCategory,
  }) {
    const parseParams = process_CustomeAction_params(_.get(actionLayout, 'params', detailData, {}));

    const response = await CustomActionService.post({
      objectApiName,
      actionLayout,
      ids: [_.get(detailData, 'id')],

      token: global.FC_CRM_TOKEN,
      parseParams,
    });

    this.customOnsuccessHandler({ customOnsuccessCategory, actionLayout })(response);
  }

  //* 自定义按钮成功后回调处理
  static customOnsuccessHandler = ({ actionLayout, customOnsuccessCategory }) => (response) => {
    if (response) {
      /**
       * 接口回调
       */
      const { onSuccess } = getCustomActionCallbacks({
        action: actionLayout,
      });
      new Function('__web__', '__phone__', '__pad__', onSuccess)(
        null,
        {
          thiz: customOnsuccessCategory,
          actionLayout,
          message: {
            success: toastSuccess,
            error: toastError,
            warning: toastWaring,
            default: toastDefault,
          },
        },
        null,
      );
    }
  };

  // * 工作流自定义按钮
  static workFlowCustomerAction({
    navigation,
    detailData,
    actionLayout,
    objectApiName,
    refreshDetail,
  }) {
    const actionCode = _.get(actionLayout, 'action_code');
    const action = _.get(actionLayout, 'action');

    if (actionCode === WORK_FLOW_ACTION_SUBMIT || actionCode === WORK_FLOW_ACTION_RESUBMIT) {
      //* 提交审批
      //* 首次提交审批和再次提交审批 approval_flow_result都为0,再次提交(因为撤回过)的approval_flow_status为3
      WorkflowAction.submitAction({ actionLayout, detailData, objectApiName, refreshDetail });
    } else if (_.has(WORK_FLOW_PROCESS_ACTION_CONFIG, actionCode)) {
      //* 审批流程操作
      const matchActionConfig = _.get(WORK_FLOW_PROCESS_ACTION_CONFIG, actionCode);
      navigation.navigate('WorkFlowOpinion', {
        type: actionCode,
        actionLayout,
        callback: (params) => {
          matchActionConfig.callback({
            action,
            detailData,
            refreshDetail,
            objectApiName,
            ...params,
          });
        },
      });
    } else if (actionCode === WORK_FLOW_ACTION_HISTORY) {
      //* 跳转审批历史
      WorkflowAction.navigateHistory({ actionLayout, detailData, navigation });
    }
  }
}
