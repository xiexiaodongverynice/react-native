/**
 * @flow
 */

import React from 'react';
import _ from 'lodash';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { ListItem, Left, Body, Icon, Textarea } from 'native-base';
import WorkflowAction from './workflowAction';
import AttachmentItem from '../formComponents/attachment/AttachmentItem';
import themes from '../../tabs/common/theme';
import I18n from '../../i18n';

type updateDataType = (field: string, value: any) => void;

type WorkFlowCommonType = {
  navigation: any,
  updateData: updateDataType,
  data: any,
  type?: string,
  actionLayout: any,
};

const WorkFlowTextarea = ({ updateData }: { updateData: updateDataType }) => (
  <Body style={{ flex: 2 }}>
    <Textarea
      placeholder={I18n.t('WorkFlow.Enter')}
      placeholderTextColor={themes.color_text_placeholder}
      underlineColorAndroid="transparent"
      onChangeText={_.debounce((val) => {
        updateData(WORK_FLOW_COMMENT, val);
      }, 50)}
      style={{
        textAlign: 'right',
        fontSize: themes.font_size_base,
        height: 65,
        justifyContent: 'center',
        alignItems: 'center',
        textAlignVertical: 'center',
      }}
    />
  </Body>
);

// * 审批同意
const WorkFlowAgreeComponent = ({ navigation, data, updateData }: WorkFlowCommonType) => {
  return (
    <ListItem>
      <Left style={{ flex: 1, alignSelf: 'flex-start', paddingTop: 5 }}>
        <Text>{I18n.t('WorkFlow.ApprovalComment')}</Text>
      </Left>
      <WorkFlowTextarea updateData={updateData} />
    </ListItem>
  );
};

// * 审批撤回
const WorkFlowRecallComponent = ({ navigation, data, updateData }: WorkFlowCommonType) => {
  return (
    <ListItem>
      <Left style={{ flex: 1, alignSelf: 'flex-start', paddingTop: 5 }}>
        <Text>{I18n.t('WorkFlow.RecallReason')}</Text>
      </Left>
      <WorkFlowTextarea updateData={updateData} />
    </ListItem>
  );
};

//* 审批拒绝
const WorkFlowRefuseComponent = ({ navigation, data, updateData }: WorkFlowCommonType) => {
  const { [WORK_FLOW_ATTACHMENT]: attachmentData = [] } = data;

  const _setAttData = (selected) => {
    const attachmentUpdateData = _.get(selected, 'selected[0].value', []);
    updateData(WORK_FLOW_ATTACHMENT, attachmentUpdateData);
  };

  return (
    <View>
      <ListItem>
        <Left style={{ flex: 1, alignSelf: 'flex-start', paddingTop: 5 }}>
          <Text>{I18n.t('WorkFlow.ApprovalComment')}</Text>
          <Text style={{ color: 'red', marginLeft: 3, textAlignVertical: 'center' }}>*</Text>
        </Left>
        <WorkFlowTextarea updateData={updateData} />
      </ListItem>
      <ListItem>
        <Left style={{ flex: 1 }}>
          <Text>{I18n.t('WorkFlow.Attachment')}</Text>
        </Left>
        <AttachmentItem
          data={attachmentData}
          field={{ field: 'att' }}
          handleCreate={_setAttData}
          navigation={navigation}
          pageType="edit"
        />
      </ListItem>
    </View>
  );
};

//* 审批委托或加签
const WorkFlowEntrustComponent = ({
  type,
  navigation,
  data,
  updateData,
  actionLayout,
}: WorkFlowCommonType) => {
  const _navigateApprovalOption = () => {
    navigation.navigate('WorkFlowSelect', { type, callback: updateData, data, actionLayout });
  };
  const field = type == WORK_FLOW_ACTION_DELEGATE ? WORK_FLOW_ENTRUST : WORK_FLOW_COUNTERSIGN;
  const entrustMenber = _.get(data, field, []);
  return (
    <ListItem>
      <Left>
        <Text style={{ flex: 1 }}>
          {type == WORK_FLOW_ACTION_DELEGATE
            ? I18n.t('WorkFlow.Text.DelegatedApprover')
            : I18n.t('WorkFlow.Text.AddedApprover')}
        </Text>
      </Left>
      <Body>
        <TouchableOpacity
          onPress={_navigateApprovalOption}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}
        >
          {_.isEmpty(entrustMenber) ? (
            <Text style={{ color: themes.color_text_placeholder }}>
              {I18n.t('WorkFlow.Choose')}
            </Text>
          ) : (
            <Text>{I18n.t('WorkFlow.Choosed')}</Text>
          )}
          <Icon
            name="ios-arrow-forward"
            style={[styles.icon, { textAlign: 'right', paddingLeft: 5 }]}
          />
        </TouchableOpacity>
      </Body>
    </ListItem>
  );
};

export const WORK_FLOW_RESULT_CONFIG = {
  0: I18n.t('WorkFlow.Result.Undisposed'),
  1: I18n.t('WorkFlow.Result.InProgress'),
  2: I18n.t('WorkFlow.Result.Approved'),
  3: I18n.t('WorkFlow.Result.Rejected'),
};

export const WORK_FLOW_COMMENT = 'comment';
export const WORK_FLOW_ATTACHMENT = 'attachments';
export const WORK_FLOW_ENTRUST = 'assignee';
export const WORK_FLOW_COUNTERSIGN = 'assignee';

export const WORK_FLOW_ACTION_SUBMIT = 'workflow_submit'; //* 提交审批
export const WORK_FLOW_ACTION_RESUBMIT = 'workflow_resubmit'; //* 重新提交审批
export const WORK_FLOW_ACTION_RECALL = 'workflow_recall'; //* 撤回
export const WORK_FLOW_ACTION_AGREE = 'workflow_agree'; //* 同意
export const WORK_FLOW_ACTION_REJECT = 'workflow_reject'; //* 拒绝
export const WORK_FLOW_ACTION_DELEGATE = 'workflow_delegate'; //* 委托
export const WORK_FLOW_ACTION_ADD_EXECUTION = 'workflow_add_execution'; //* 加签
export const WORK_FLOW_ACTION_HISTORY = 'workflow_history'; //* 审批历史

//* 用于渲染审批页面数据和校验规则
export const WORK_FLOW_COMPONENT_CONFIG = {
  [WORK_FLOW_ACTION_AGREE]: {
    component: WorkFlowAgreeComponent,
    title: I18n.t('WorkFlow.ApprovalAgree'),
  },
  [WORK_FLOW_ACTION_RECALL]: {
    component: WorkFlowRecallComponent,
    title: I18n.t('WorkFlow.ApprovalRecall'),
  },
  [WORK_FLOW_ACTION_REJECT]: {
    component: WorkFlowRefuseComponent,
    rules: [{ field: WORK_FLOW_COMMENT, errorMes: I18n.t('WorkFlow.Error.EnterComment') }],
    title: I18n.t('WorkFlow.ApprovalReject'),
  },
  [WORK_FLOW_ACTION_DELEGATE]: {
    component: WorkFlowEntrustComponent,
    rules: [{ field: WORK_FLOW_ENTRUST, errorMes: I18n.t('WorkFlow.Error.ChooseDelegate') }],
    title: I18n.t('WorkFlow.ApprovalDelegate'),
  },
  [WORK_FLOW_ACTION_ADD_EXECUTION]: {
    component: WorkFlowEntrustComponent,
    rules: [{ field: WORK_FLOW_COUNTERSIGN, errorMes: I18n.t('WorkFlow.Error.ChooseSigner') }],
    title: I18n.t('WorkFlow.ApprovalAddSigner'),
  },
};

//* 组装工作流action的参数和回调函数
export const WORK_FLOW_PROCESS_ACTION_CONFIG = {
  [WORK_FLOW_ACTION_AGREE]: {
    callback: (params) => {
      WorkflowAction.agereeOrRejectHandle(params);
    },
  },
  [WORK_FLOW_ACTION_RECALL]: {
    callback: (params) => {
      WorkflowAction.recallHandle(params);
    },
  },
  [WORK_FLOW_ACTION_REJECT]: {
    callback: (params) => {
      WorkflowAction.agereeOrRejectHandle(params);
    },
  },
  [WORK_FLOW_ACTION_DELEGATE]: {
    callback: (params) => {
      WorkflowAction.delegateHandle(params);
    },
  },
  [WORK_FLOW_ACTION_ADD_EXECUTION]: {
    callback: (params) => {
      WorkflowAction.addExecutionHandle(params);
    },
  },
};

const styles = StyleSheet.create({
  icon: {
    color: themes.color_header_icon,
    fontSize: themes.font_header_size,
  },
});
