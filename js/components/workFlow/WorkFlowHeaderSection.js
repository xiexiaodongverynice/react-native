/**
 * @flow
 */

import _ from 'lodash';
import React from 'react';
import { View, Text } from 'react-native';
import { ListItem, Left, Body } from 'native-base';
import { WORK_FLOW_RESULT_CONFIG } from './common';
import { ListSectionSeparatorView } from '../list/ListComponents';
import I18n from '../../i18n';
import { DetailScreenSectionHeader } from '../../tabs/common/components';
import detailScreen_styles from '../../styles/detailScreen_styles';

type workFlowDataType = {
  approval_flow_result?: number | string,
  approval_flow_status?: number | string,
  workflowResult?: any,
};

const setLabelColor = (approvalFlowResult, approvalFlowStatus) => {
  switch (parseInt(approvalFlowResult)) {
    case 2:
      return '#20B558';
    case 3:
      return '#f10';
    default:
      return '#FF9933';
  }
};

//* 工作流详情页header显示
//* approval_flow_result 表示流程结果 0：未提交、待提交 | 1：处理中 | 2：通过 | 3：拒绝
//* approval_flow_status 表示流程状态 0：草稿、待提交 | 1：处理中 | 2：结束 | 3：撤回
const WorkFlowHeaderSection = ({ data }: { data: workFlowDataType }) => {
  const approvalFlowResult = _.get(data, 'approval_flow_result', 0);
  const approvalFlowStatus = _.get(data, 'approval_flow_status', 0);
  const workflowData = _.get(data, 'workflowResult', {});

  const isShow = (approvalFlowResult > 0 || approvalFlowStatus == 3) && !_.isEmpty(workflowData);
  if (!isShow) {
    return null;
  }

  const workFlowStatusLabel =
    approvalFlowResult == 0
      ? I18n.t('WorkFlowHeaderSection.Recalled')
      : _.get(WORK_FLOW_RESULT_CONFIG, approvalFlowResult, '');

  const workFlowStatusLabelColor = setLabelColor(approvalFlowResult, approvalFlowStatus);

  return (
    <View style={detailScreen_styles.sectionWrapperStyle}>
      <DetailScreenSectionHeader text={I18n.t('WorkFlowHeaderSection.ApprovalInfo')} />
      <ListItem style={styles.borderWidth0} key={0}>
        <Left>
          <Text style={{ flex: 1 }}>{I18n.t('WorkFlowHeaderSection.ApprovalFlow')}</Text>
        </Left>
        <Body>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Text>{_.get(workflowData, 'process_name', '')}</Text>
          </View>
        </Body>
      </ListItem>
      <ListItem style={styles.borderWidth0} key={1}>
        <Left>
          <Text style={{ flex: 1 }}>{I18n.t('WorkFlowHeaderSection.FlowStatus')}</Text>
        </Left>
        <Body>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Text style={{ color: workFlowStatusLabelColor }}>{workFlowStatusLabel}</Text>
          </View>
        </Body>
      </ListItem>
    </View>
  );
};

const styles = {
  borderWidth0: {
    borderWidth: 0,
    borderBottomWidth: 0,
  },
};
export default WorkFlowHeaderSection;
