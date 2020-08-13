/*
 * @flow
 * 审批意见页
 */

import React from 'react';
import _ from 'lodash';
import { StyleSheet, Text } from 'react-native';
import { Body, Container, Right, Title, Content, Left, Button } from 'native-base';
import { StyledHeader, CustomerConfirm } from '../common/components';
import I18n from '../../i18n';
import { WORK_FLOW_COMPONENT_CONFIG } from '../../components/workFlow/common';
import themes from '../common/theme';
import { toastError } from '../../utils/toast';

type Props = {
  navigation: any,
};

type States = {
  data: Object,
  isRequired: Array,
};

class WorkFlowOpinionScreen extends React.Component<Props, States> {
  constructor(props) {
    super(props);
    const { navigation } = props;
    this.params = _.get(navigation, 'state.params', {});
    const type = _.get(this.params, 'type');
    this.workFlowDes = WORK_FLOW_COMPONENT_CONFIG[type];

    this.state = {
      data: {},
    };
  }

  updateData = (field, value) => {
    const { data } = this.state;
    const newData = { ...data, [field]: value };
    this.setState({ data: newData });
  };

  navigateBack = () => {
    const { navigation } = this.props;
    navigation.goBack();
  };

  onSubmit = () => {
    const { navigation } = this.props;
    const { data } = this.state;
    const rules = _.get(this.workFlowDes, 'rules', []);
    const callback = _.get(this.params, 'callback', _.noop);

    //* 没有必填项直接触发自定义按钮
    if (!_.isEmpty(rules)) {
      const failedData = _.find(rules, (perRule) => {
        const value = _.get(data, perRule.field);
        return _.isUndefined(value) || _.eq(value, '') || _.isNull(value);
      });

      if (!_.isEmpty(failedData)) {
        toastError(failedData.errorMes);
        return;
      }
    }

    CustomerConfirm({
      title: I18n.t('WorkFlowOpinionScreen.ConfirmSubmit'),
      onOKObj: {
        handle() {
          callback({ data, navigation });
        },
      },
      onCancelObj: {
        handle() {},
      },
    });
  };

  renderComponents = () => {
    const { data } = this.state;
    const { navigation } = this.props;
    const type = _.get(this.params, 'type');
    const actionLayout = _.get(this.params, 'actionLayout');

    const processProps = {
      navigation,
      actionLayout,
      updateData: this.updateData,
      data,
      type,
    };

    const component = this.workFlowDes.component;
    return React.createElement(component, processProps, null);
  };

  renderHeader() {
    const type = _.get(this.params, 'type');
    return (
      <StyledHeader>
        <Left>
          <Button
            transparent
            style={[styles.paddingLR10, styles.margin0]}
            onPress={this.navigateBack}
          >
            <Text style={styles.navText}>{I18n.t('common_cancel')}</Text>
          </Button>
        </Left>
        <Body style={{ alignItems: 'center', flex: 1 }}>
          <Title
            style={{
              color: themes.title_text_color,
              fontSize: themes.title_size,
            }}
          >
            {_.get(WORK_FLOW_COMPONENT_CONFIG, `${type}.title`, '审批')}
          </Title>
        </Body>
        <Right>
          <Button transparent style={[styles.paddingLR10, styles.margin0]} onPress={this.onSubmit}>
            <Text style={styles.navText}>{I18n.t('common_sure')}</Text>
          </Button>
        </Right>
      </StyledHeader>
    );
  }
  render() {
    return (
      <Container style={{ backgroundColor: themes.fill_base }}>
        {this.renderHeader()}
        <Content>{this.renderComponents()}</Content>
      </Container>
    );
  }
}

export default WorkFlowOpinionScreen;

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
  navText: {
    color: themes.title_text_color,
    fontSize: themes.font_size_base,
  },
  margin0: {
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  paddingLR10: {
    paddingLeft: 10,
    paddingRight: 10,
  },
});
