/*
 * @flow
 * 审批加签或委托页
 */

import React from 'react';
import _ from 'lodash';
import { TouchableOpacity, StyleSheet } from 'react-native';
import {
  Body,
  Container,
  Right,
  Title,
  View,
  Text,
  Left,
  Content,
  ListItem,
  Button,
} from 'native-base';
import SearchBarView from '../../components/common/SearchBarView';
import { HeaderLeft, StyledHeader } from '../common/components';
import CheckBoxView from '../../components/common/CheckBoxView';
import ListDateView from '../../components/list/ListDataView';
import {
  WORK_FLOW_ENTRUST,
  WORK_FLOW_COUNTERSIGN,
  WORK_FLOW_ACTION_DELEGATE,
} from '../../components/workFlow/common';
import I18n from '../../i18n';
import themes from '../common/theme';
import { processCriterias } from '../../utils/criteriaUtil';

type Prop = {
  navigation: any,
};

class WorkFlowSelectScreen extends React.PureComponent<Props, States> {
  constructor(props) {
    super(props);
    const { navigation } = props;

    this.listHeight = themes.deviceHeight - themes.menuHeight - 30;
    this.params = _.get(navigation, 'state.params', {});
    const type = _.get(this.params, 'type');
    this.field = type === WORK_FLOW_ACTION_DELEGATE ? WORK_FLOW_ENTRUST : WORK_FLOW_COUNTERSIGN;
    const data = _.get(this.params, `data.${this.field}`, []);

    this.state = {
      selectState: data,
      keyWord: '',
    };
  }

  navigateBack = () => {
    const { navigation } = this.props;
    navigation.goBack();
  };

  onSubmit = () => {
    const { navigation } = this.props;
    const { selectState } = this.state;

    const callback = _.get(this.params, 'callback', _.noop);

    if (!_.isEmpty(selectState)) {
      callback(this.field, selectState);
    }
    navigation.goBack();
  };

  selected = (itemId, matchSelectedIndex) => {
    const { selectState } = this.state;

    const type = _.get(this.params, 'type');
    let newSelectStates = [];

    if (type === WORK_FLOW_ACTION_DELEGATE) {
      newSelectStates = [itemId];
    } else {
      newSelectStates = selectState.slice();
      if (matchSelectedIndex >= 0) {
        newSelectStates.splice(matchSelectedIndex, 1);
      } else {
        newSelectStates.push(itemId);
      }
    }

    this.setState({ selectState: newSelectStates });
  };

  renderItem = ({ item, index }) => {
    const { selectState } = this.state;
    const matchSelectedIndex = selectState.indexOf(item.id);

    return (
      <ListItem style={{ height: 60 }} key={_.get(item, 'id', index)}>
        <CheckBoxView
          checked={matchSelectedIndex >= 0}
          style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'center' }}
          location="left"
          handleCheck={() => {
            this.selected(item.id, matchSelectedIndex);
          }}
        >
          <View style={{ marginLeft: 10 }}>
            <Text>{_.get(item, 'name', '')}</Text>
          </View>
        </CheckBoxView>
      </ListItem>
    );
  };

  composeKeyWordCri = () => {
    const { keyWord } = this.state;
    //* 处理搜索条件
    const keyWordCriteria =
      keyWord !== ''
        ? [
            {
              field: 'name',
              operator: 'contains',
              value: [keyWord],
            },
          ]
        : [];

    const initCriterias = processCriterias(_.get(this.params, 'actionLayout.filterCriterias', []));

    return _.concat([], initCriterias, keyWordCriteria);
  };

  render() {
    const INIT_CRITERIAS = [
      { field: 'enable', operator: '==', value: [true] },
      { field: 'id', operator: '<>', value: [global.FC_CRM_USERID] },
    ];
    const criterias = _.concat([], INIT_CRITERIAS, this.composeKeyWordCri());

    return (
      <Container style={{ backgroundColor: themes.fill_base }}>
        <StyledHeader>
          <Left>
            <Button style={{ paddingLeft: 0 }} transparent onPress={this.navigateBack}>
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
              {I18n.t('WorkFlow.Text.ChooseApprover')}
            </Title>
          </Body>
          <Right>
            <Button style={{ paddingRight: 0 }} transparent onPress={this.onSubmit}>
              <Text style={styles.navText}>{I18n.t('common_sure')}</Text>
            </Button>
          </Right>
        </StyledHeader>
        <SearchBarView
          onChange={(value) => {
            this.setState({ keyWord: value });
          }}
        />
        <Content>
          <ListDateView
            ignoreNumHeader
            style={{ height: this.listHeight }}
            objectApiName="user_info"
            criterias={criterias}
            renderItem={this.renderItem}
          />
        </Content>
      </Container>
    );
  }
}

export default WorkFlowSelectScreen;

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
});
