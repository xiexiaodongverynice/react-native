/**
 * ! 老版本审批流
 * @flow
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { ListItem, Left, Body, Icon } from 'native-base';
import _ from 'lodash';
import moment from 'moment';
import I18n from '../../i18n';
import themes from '../../tabs/common/theme';
import { StyledSeparator } from '../../tabs/common/components';
import DetailListItem from '../../tabs/common/DetailListItem';

const APPROVAL_STATUS = ['accepted', 'waiting', 'rejected', 'agreed'];

type Prop = {
  navigation: any,
  approvalFlowInfo: {
    approval_flow: Object,
    approval_nodes: Array,
  },
};

type State = {};

export default class ApprovalFlowSection extends React.Component<Prop, State> {
  getTimeLineData = () => {
    const approval_nodes = _.get(this.props.approvalFlowInfo, 'approval_nodes');
    const approval_flow = _.get(this.props.approvalFlowInfo, 'approval_flow');
    let timeLine = approval_nodes
      .sort((x, y) => {
        return x.create_time - y.create_time > 0;
      })
      .filter((node) => _.includes(APPROVAL_STATUS, node.status))
      .map((node) => {
        if (node.status === 'agreed') {
          return { approval_node: node, circleColor: 'green' };
        } else if (node.status === 'rejected') {
          return { approval_node: node, circleColor: 'red' };
        } else if (node.status === 'waiting') {
          return { approval_node: node, circleColor: '#44a7f9' };
        } else if (node.status === 'accepted') {
          return { approval_node: node, circleColor: '#44a7f9' };
        }
      });
    const startTimeLine = {
      approval_node: approval_flow,
      circleColor: 'green',
      status: 'start',
    };
    //* 安卓在release下为倒序，所以在此进行处理(原因未知)
    if (Platform.OS !== 'ios') {
      timeLine = timeLine.reverse();
    }
    timeLine.unshift(startTimeLine);

    return timeLine;
  };

  navTimeLine = () => {
    const { navigation, approvalFlowInfo } = this.props;
    const approval_nodes = _.get(approvalFlowInfo, 'approval_nodes');

    if (!_.isEmpty(approval_nodes)) {
      const data = this.getTimeLineData();
      navigation.navigate('TimeLine', { data, type: 'approval' });
    }
  };

  approvalStatus = () => {
    let text = '';
    const { approvalFlowInfo } = this.props;
    const status = _.get(approvalFlowInfo, 'approval_flow.status');

    if (status === 'agreed') {
      text = I18n.t('ApprovalFlowSection.ApprovalPassed');
    } else if (status === 'rejected') {
      text = I18n.t('ApprovalFlowSection.ApprovalRejected');
    } else if (!status) {
      text = '';
    } else {
      const approval_nodes = _.get(approvalFlowInfo, 'approval_nodes');
      if (!approval_nodes) return;
      const waitingNodes = approval_nodes
        .filter((x) => x.type === 'user_task' && x.status === 'waiting')
        .map((e) => e.name);

      text = `${I18n.t('ApprovalFlowSection.Wait')}:${waitingNodes[0]}`;
    }
    return text;
  };

  renderOrderNumbers = () => {
    let orderDec = '';
    const { approvalFlowInfo } = this.props;
    const orderNumber = _.get(approvalFlowInfo, 'approval_flow.id');
    const status = _.get(approvalFlowInfo, 'approval_flow.status');
    const orderName = _.get(approvalFlowInfo, 'approval_flow.name');
    if (status === 'rejected' || status === 'agreed') {
      orderDec = `${orderName}-${orderNumber}`;
    } else {
      orderDec = `${orderNumber}`;
    }

    return <DetailListItem title="单号" data={orderDec} />;
  };

  renderFormStatus = () => (
    <ListItem>
      <Left>
        <Text style={{ flex: 1 }}>{I18n.t('ApprovalFlowSection.FlowStatus')}</Text>
      </Left>
      <Body>
        <TouchableOpacity
          onPress={this.navTimeLine}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}
        >
          <Text>{this.approvalStatus()}</Text>
          <Icon
            name="ios-arrow-forward"
            style={[styles.icon, { textAlign: 'right', paddingLeft: 5 }]}
          />
        </TouchableOpacity>
      </Body>
    </ListItem>
  );

  render() {
    return (
      <View>
        <StyledSeparator
          key="approvalFlow"
          style={{ backgroundColor: themes.fill_subheader, height: 30 }}
        >
          <Text
            style={{
              fontSize: themes.list_separator_text_size,
              fontWeight: 'bold',
              color: themes.list_subtitle_color,
            }}
          >
            ${I18n.t('ApprovalFlowSection.ApprovalInfo')}
          </Text>
        </StyledSeparator>
        {this.renderOrderNumbers()}
        {this.renderFormStatus()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  item: {
    padding: 10,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    borderBottomWidth: themes.regular_border_width,
    borderBottomColor: themes.border_color_base,
  },
  text: {
    textAlign: 'left',
    textAlignVertical: 'center',
  },
  icon: {
    color: themes.color_header_icon,
    fontSize: themes.font_header_size,
  },
});
