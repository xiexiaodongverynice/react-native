/**
 * @flow
 */

import _ from 'lodash';
import QueryComposer from 'fc-common-lib/query-composer';
import { Confirm } from '../../tabs/common/components';
import CustomActionService from '../../services/customActionService';
import * as Util from '../../utils/util';
import { toastError, toastSuccess } from '../../utils/toast';
import { getSrc } from '../../tabs/common/helpers/modalWidget';
import {
  WORK_FLOW_COMMENT,
  WORK_FLOW_COUNTERSIGN,
  WORK_FLOW_ENTRUST,
  WORK_FLOW_ATTACHMENT,
} from './common';

type workFlowParamsType = {
  action: any,
  refreshDetail: void,
  navigation: any,
  detailData: any,
  data: any,
};

type cutomerActionParamsType = {
  ...workFlowParamsType,
  actionParams: {
    taskId?: number | string,
    assigneeList?: Array,
    comment?: string,
    procInstId?: string,
    assignee?: string,
    reason?: string,
    businessKey?: string,
  },
};

export default class WorkflowAction {
  static async submitAction({
    actionLayout,
    objectApiName,
    detailData = {},
    refreshDetail = _.noop,
  }) {
    let business_title;
    const action = _.get(actionLayout, 'action');
    const title = _.get(actionLayout, 'business_title', '');
    if (_.isString(title)) {
      business_title = title;
    } else if (_.isObject(title) && _.has(title, 'expression')) {
      business_title = Util.executeDetailExp(_.get(title, 'expression'), detailData);
    }

    const basicInfo = {
      business_title,
      business_object_api_name: objectApiName,
      business_record_id: _.get(detailData, 'id').toString(),
      businessKey: `${_.get(detailData, 'workflowResult.id', '')}`,
    };

    const payload = {
      objectApiName,
      action,
      ids: [],
      params: _.assign(_.get(actionLayout, 'params', {}), basicInfo),
      token: global.FC_CRM_TOKEN,
    };

    Confirm({
      title: '确定提交审批?',
      onOK() {
        CustomActionService.resolveAction(payload).then((res) => {
          if (!_.isNull(res) && !_.isUndefined(res)) {
            toastSuccess('操作成功');
            refreshDetail();
          }
        });
      },
      onCancel() {},
    });
  }

  static navigateHistory({ actionLayout, detailData, navigation }) {
    const { options = {}, label } = actionLayout;
    const { params = {} } = options;
    let { src } = options;

    if (!src) {
      toastError('外部链接丢失');
      return;
    }

    src = getSrc(src);
    navigation.navigate('WebView', {
      navParam: {
        label,
        external_page_src: `${src}?${QueryComposer.fromObject(
          Object.assign(
            {},
            Util.mapObject(params, {
              thizRecord: detailData,
            }),
          ),
        )}`,
        showBack: true,
      },
    });
  }

  static async executeAction({
    action,
    refreshDetail,
    navigation,
    detailData,
    actionParams,
  }: cutomerActionParamsType) {
    const payload = {
      objectApiName: detailData.object_describe_name,
      action,
      ids: [],
      params: actionParams,
      token: global.FC_CRM_TOKEN,
    };

    const result = await CustomActionService.resolveAction(payload);

    if (!_.isNull(result) && !_.isUndefined(result)) {
      toastSuccess('操作成功');
      navigation.goBack();
      refreshDetail();
    }
  }

  static async agereeOrRejectHandle(params: workFlowParamsType) {
    const { detailData, data } = params;
    const workFlowData = _.get(detailData, 'workflowResult', {});
    const actionParams = {
      taskId: `${_.get(workFlowData, 'current_user_operation_task.id')}`,
      procInstId: workFlowData.proc_inst_id,
      comment: _.get(data, WORK_FLOW_COMMENT, ''),
    };

    //* 审批拒绝时会传递附件
    if (!_.isEmpty(data[WORK_FLOW_ATTACHMENT])) {
      //* 组装附件需要的格式
      actionParams.attachments = _.map(data[WORK_FLOW_ATTACHMENT], (key) => ({
        url: key,
        name: '',
        description: '',
      }));
    } else {
      actionParams.attachments = [];
    }

    this.executeAction({ actionParams, ...params });
  }

  static async recallHandle(params: workFlowParamsType) {
    const { detailData, data } = params;
    const workFlowData = _.get(detailData, 'workflowResult', {});
    const actionParams = {
      businessKey: detailData.approval_flow_business_key,
      procInstId: workFlowData.proc_inst_id,
      reason: _.get(data, WORK_FLOW_COMMENT, ''),
    };

    this.executeAction({ actionParams, ...params });
  }

  static async delegateHandle(params: workFlowParamsType) {
    const { detailData, data } = params;
    const workFlowData = _.get(detailData, 'workflowResult', {});

    const actionParams = {
      taskId: `${_.get(workFlowData, 'current_user_operation_task.id')}`,
      procInstId: workFlowData.proc_inst_id,
      assignee: `${_.get(data, `${WORK_FLOW_ENTRUST}.[0]`)}`,
    };

    this.executeAction({ actionParams, ...params });
  }

  static async addExecutionHandle(params: workFlowParamsType) {
    const { detailData, data } = params;
    const workFlowData = _.get(detailData, 'workflowResult', {});
    const assigneeList = _.get(data, WORK_FLOW_COUNTERSIGN, []).map((id) => `${id}`);

    const actionParams = {
      taskId: `${_.get(workFlowData, 'current_user_operation_task.id')}`,
      assigneeList,
    };
    this.executeAction({ actionParams, ...params });
  }
}
