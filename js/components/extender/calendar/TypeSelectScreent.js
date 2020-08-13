/**
 * @flow
 */

import React from 'react';
import moment from 'moment';
import { connect } from 'react-redux';
import { View, Text } from 'react-native';
import { Header, Title, Content, Button, Container } from 'native-base';
import * as _ from 'lodash';
import { composeCustomerData } from './help';
import { HeaderLeft, StyledBody, HeaderRight, StyledHeader } from '../../../tabs/common/components';
import themes from '../../../tabs/common/theme';
import * as Util from '../../../utils/util';
import handleUpdateCascade, { CASCADE_CREATE } from '../../../utils/helpers/handleUpdateCascade';

type Props = {
  navigation: any,
  dispatch: void,
  screen: any,
  onComponentDidMount: void,
  onComponentUnMount: void,
};

type States = {};

class TypeSelect extends React.PureComponent<Props, States> {
  state = {
    actionList: [],
  };

  existData = [];

  componentDidMount() {
    const { navigation, onComponentDidMount } = this.props;

    if (_.isFunction(onComponentDidMount)) {
      onComponentDidMount(this.refresh);
    }
    const params = _.get(navigation, 'state.params');
    const { field_section = {}, existData = [] } = params;
    const buttons = field_section['extender_actions'];
    const actions = [];
    _.each(buttons, (btn) => {
      if (btn.action === 'ADD') {
        actions.push(btn);
      }
    });

    this.existData = existData;

    this.setState({
      actionList: actions,
    });
  }

  componentWillUnmount() {
    const { onComponentUnMount } = this.props;
    if (_.isFunction(onComponentUnMount)) {
      onComponentUnMount();
    }
  }

  handlerSelect = async (data, action, timestamp, thisDay) => {
    // 点击确定后回调函数存储selectedData

    const callDate = moment(thisDay).valueOf();
    const { navigation, dispatch } = this.props;
    const params = _.get(navigation, 'state.params');
    const { parentRecord, field_section = {}, pageType } = params;
    const relatedListName = _.get(field_section, 'related_list_name');

    const parentId = _.get(parentRecord, 'id');
    const resultData = composeCustomerData({ data, action, callDate, field_section });

    if (resultData.length > 0) {
      handleUpdateCascade({
        data: resultData,
        status: CASCADE_CREATE,
        relatedListName,
        parentId,
        dispatch,
      });
    }
    navigation.goBack();
  };

  pressAction(action) {
    // 选择添加计划类型
    const { navigation } = this.props;
    const params = _.get(navigation, 'state.params');
    const { parentRecord, field_section = {}, pageType, timestamp, thisDay } = params;
    const preApiName = action.select_object;
    const ref_object = _.get(action, 'ref_object', null);
    const ref_record_type = _.get(action, 'ref_record_type', null);
    const preRecord_type = action.select_object_record_type;
    const preCriterias = action.target_filter_criterias
      ? action.target_filter_criterias.criterias
      : [];

    //* 用与于过滤已选择的选项
    // const _existDataSet = _.map(this.existData, (e) => _.get(e, preApiName, ''));
    const _existDataSet = _.chain(this.existData)
      .filter(
        (e) =>
          // _.get(e, 'object_describe_name') === ref_object &&
          _.get(e, 'record_type') === ref_record_type,
      )
      .map((i) => _.get(i, preApiName, ''))
      .valueOf();

    const preParams = {
      apiName: preApiName,
      callback: (data) => this.handlerSelect(data, action, timestamp, thisDay, navigation),
      dataRecordType: preRecord_type,
      multipleSelect: true,
      targetRecordType: 'master',
      related: true,
      preCriterias,
      existData: [...new Set(_existDataSet)],
      otherGoBack: true,
    };
    navigation.navigate('Relation', preParams);
  }

  renderActionList(actionList) {
    return (
      <View>
        {_.map(actionList, (action, index) => {
          const { hidden_expression } = action;
          const isHidden = Util.executeExpression(hidden_expression);
          if (!isHidden) {
            return (
              <Button
                key={index}
                full
                light
                style={{ borderBottomColor: 'gray', borderBottomWidth: 1 }}
                onPress={() => this.pressAction(action)}
              >
                <Text>{action.label}</Text>
              </Button>
            );
          }
        })}
      </View>
    );
  }

  render() {
    const { navigation, dispatch, screen } = this.props;
    const { actionList } = this.state;
    return (
      <Container>
        <StyledHeader>
          <HeaderLeft
            style={{ flex: 1 }}
            navigation={navigation}
            dispatch={dispatch}
            screen={screen}
          />
          <StyledBody>
            <Title
              style={{
                color: themes.title_text_color,
                fontSize: themes.title_size,
              }}
            >
              选择
            </Title>
          </StyledBody>
          <HeaderRight />
        </StyledHeader>
        <Content>{this.renderActionList(actionList)}</Content>
      </Container>
    );
  }
}

export default connect()(TypeSelect);
