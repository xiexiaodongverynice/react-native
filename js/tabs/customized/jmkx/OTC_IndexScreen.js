/**
 * @flow
 */

import React from 'react';
import moment from 'moment';
import _ from 'lodash';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Container, Header, Text, Left, Body, Right, Button, Icon, Title } from 'native-base';
import { View, StyleSheet, DeviceEventEmitter, ScrollView } from 'react-native';

import { JMKX_PROFILE } from './utils';
import themes from '../../common/theme';
import requestLayout, { setCacheLayout } from '../../../actions/pageLayout';
import { queryRecordListAction, clearQuery } from '../../../actions/query';
import { needRefreshAttendee } from '../../../actions/event';
import IndexScreen from '../../IndexScreen';
import IndexDataParser from '../../../services/dataParser';
import I18n from '../../../i18n';
import { StyledHeader } from '../../common/components';

type Props = {
  profile: object,
  navigation: any,
  screenInfo: any,
  indexData: any,
};

class OTCIndexScreen extends React.Component<Props, States> {
  state = {
    profile_name: 'otc_gm',
    viewDeep: 0,
    next: false,
    isIndex: false,
    region: [],
    result: [],
    displayNames: [],
    summrySearch: {},
  };
  componentDidMount() {
    const { profile } = this.props;
    const { api_name } = profile;
    if (api_name !== 'otc_gm') {
      this.setState({
        profile_name: api_name,
        next: true,
      });
    }
    // otc_gm 第一层全国总 otc_rsd 第二层大区总
  }
  static getDerivedStateFromProps(props, state) {
    const {
      indexData: { dutyName, profile_name, title, menuData },
      screenInfo = {},
      objectDescription,
      profile,
      navigation,
    } = props;
    let {
      indexData: { result },
    } = props;
    const { objectApiName } = screenInfo;
    let queryApiName = objectApiName;
    if (!objectApiName) {
      queryApiName = _.get(navigation, 'state.params.navParam.objectApiName', '');
    }
    const { isIndex, next, viewDeep } = state;
    const region = [];
    let displayNames = [];
    let displayField = '';
    let is_first = true;
    if (profile_name !== 'otc_gm') {
      is_first = false;
      _.each(result, (rst) => {
        if (
          _.get(rst, 'belonged_second_level_territory') &&
          !region.includes(rst.belonged_second_level_territory)
        ) {
          region.push(rst.belonged_second_level_territory);
        }
        displayField = _.get(rst, 'display_name', '');
      });
    } else {
      _.each(result, (rst) => {
        if (
          _.get(rst, 'belonged_first_level_territory') &&
          !region.includes(rst.belonged_first_level_territory)
        ) {
          region.push(rst.belonged_first_level_territory);
        }
        displayField = _.get(rst, 'display_name', '');
      });
    }
    const display_name_mapper = _.get(menuData, 'display_name_mapper', {});
    if (!_.isEmpty(display_name_mapper)) {
      result = result.map((item) => {
        item[displayField] = display_name_mapper[item[displayField]];
        return item;
      });
    }
    const display_name_restricts = _.get(menuData, 'display_name_restricts', []);
    /**
     * 判断是否对display_name有限制
     */
    if (!_.isEmpty(display_name_restricts)) {
      displayNames = display_name_restricts;
    } else {
      const currentDescription = IndexDataParser.getObjectDescByApiName(
        queryApiName,
        objectDescription,
      );
      /**
       * TODO display_name未必跟filed option有关
       */
      const desFields = _.get(currentDescription, 'fields', []);
      _.each(desFields, (des) => {
        if (des.api_name === displayField) {
          const options = _.get(des, 'options', []);
          _.each(options, (option) => {
            const value = _.get(option, 'value', '');
            if (!_.isEmpty(display_name_mapper)) {
              displayNames.push(display_name_mapper[value]);
            } else {
              displayNames.push(value);
            }
          });
        }
      });
    }
    const customerMergeItems = ['小型连锁', '核心单店', '非协议商业'];
    const newSet = new Set([...displayNames]);
    _.each(customerMergeItems, (item) => {
      if (newSet.has(item)) {
        newSet.delete(item);
      }
      if (title == '客户' && !newSet.has('分销终端')) {
        newSet.add('分销终端');
      }
    });

    return {
      isIndex,
      next,
      viewDeep,
      region,
      result,
      displayNames: [...newSet],
      is_first,
    };
  }

  gotoNext = (regionText, regionResult) => {
    const region = [];
    const is_first = false;
    _.each(regionResult, (rst) => {
      if (
        _.get(rst, 'belonged_second_level_territory') &&
        !region.includes(rst.belonged_second_level_territory)
      ) {
        region.push(rst.belonged_second_level_territory);
      }
    });
    this.setState({
      next: true,
      viewDeep: 1,
      is_first,
      region,
    });
  };

  //* 安卓返回键
  backAndroidAction = () => {
    const { navigation } = this.props;
    const { profile_name, viewDeep, next = false, isIndex = false, summrySearch } = this.state;
    if (JMKX_PROFILE.OTC.includes(profile_name) && viewDeep === 1 && next) {
      this.gotoFront();
      return true;
    }
    return false;
  };

  gotoFront = () => {
    const { result = [] } = this.state;
    const region = [];
    _.each(result, (rst) => {
      if (
        _.get(rst, 'belonged_first_level_territory') &&
        !region.includes(rst.belonged_first_level_territory)
      ) {
        region.push(rst.belonged_first_level_territory);
      }
    });
    this.setState({
      next: false,
      viewDeep: 0,
      is_first: true,
      region,
    });
  };

  gotoIndex = (regionText, regionResult) => {
    const summrySearch = _.find(regionResult, { belonged_second_level_territory: regionText });
    this.setState({
      isIndex: true,
      summrySearch,
    });
  };

  calculateCount = (displayName, regionResult) => {
    let total = 0;
    let num1 = 0;
    let num2 = 0;
    let num3 = 0;
    _.each(regionResult, (rst) => {
      const display_name = _.get(rst, 'display_name', '');

      if (displayName === rst[`${display_name}`]) {
        total += rst.count;
      } else if (displayName == '分销终端') {
        if (rst[`${display_name}`] == '核心单店') {
          num1 += rst.count;
        }
        if (rst[`${display_name}`] == '小型连锁') {
          num2 += rst.count;
        }
        if (rst[`${display_name}`] == '非协议商业') {
          num3 += rst.count;
        }
        total = num1 + num2 + num3;
      }
    });
    return total;
  };

  renderRegions(regionText, result, is_first = true) {
    const { next, displayNames = [] } = this.state;
    let total = 0;
    const regionResult = [];
    _.each(result, (rst) => {
      if (is_first) {
        const belonged_first_level_territory = _.get(rst, 'belonged_first_level_territory', '');
        if (belonged_first_level_territory === regionText) {
          const count = _.get(rst, 'count', 0);
          total += count;
          regionResult.push(rst);
        }
      } else {
        const belonged_second_level_territory = _.get(rst, 'belonged_second_level_territory', '');
        if (belonged_second_level_territory === regionText) {
          const count = _.get(rst, 'count', 0);
          total += count;
          regionResult.push(rst);
        }
      }
    });
    return (
      <View style={styles.display_item}>
        <View style={styles.item_title}>
          <Text style={{ fontWeight: '300' }}>{regionText}</Text>
          <View style={{ flexDirection: 'row', alignContent: 'center', alignItems: 'center' }}>
            {next === true ? (
              <Button
                transparent
                onPress={() => {
                  this.gotoIndex(regionText, regionResult);
                }}
              >
                <Text style={{ fontWeight: '300', color: 'black' }}>{total}</Text>
                <Icon name="ios-arrow-forward" style={{ color: '#ccc' }} />
              </Button>
            ) : (
              <Button
                transparent
                onPress={() => {
                  this.gotoNext(regionText, regionResult);
                }}
              >
                <Text style={{ fontWeight: '300', color: 'black' }}>{total}</Text>
                <Icon name="ios-arrow-forward" style={{ color: '#ccc' }} />
              </Button>
            )}
          </View>
        </View>
        <View style={styles.item_content}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {_.map(displayNames, (displayName, index) => (
              <View key={`key_dis_${index}`} style={styles.content_item}>
                <Text style={{ fontSize: 12, fontWeight: '100', color: '#696969' }}>
                  {displayName}
                </Text>
                <Text style={{ fontSize: 14, paddingTop: 10 }}>
                  {this.calculateCount(displayName, regionResult)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  }

  renderContent() {
    const {
      next = false,
      viewDeep,
      region = [],
      result = [],
      displayNames = [],
      is_first,
    } = this.state;
    let total = 0;
    _.each(result, (rst) => {
      total += rst.count;
    });
    return (
      <View>
        {next === true ? (
          <View
            style={{
              padding: 5,
              backgroundColor: themes.fill_body,
              alignContent: 'center',
              alignItems: 'flex-start',
            }}
          >
            <Text>{I18n.t('OTC_IndexScreen.Text.TotalProvince').replace('%d', region.length)}</Text>
          </View>
        ) : (
          <View style={{ marginBottom: 15 }}>
            <View style={styles.header_title}>
              <Text style={{ fontSize: 12, fontWeight: '100', color: '#696969' }}>
                {I18n.t('OTC_IndexScreen.Text.Total')}
              </Text>
              <Text style={{ fontSize: 20 }}>{total}</Text>
            </View>
            <View style={styles.header_content}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {_.map(displayNames, (displayName, index) => (
                  <View key={`display_${index}`} style={styles.content_item}>
                    <Text style={{ fontSize: 12, fontWeight: '100', color: '#696969' }}>
                      {displayName}
                    </Text>
                    <Text style={{ fontSize: 20 }}>{this.calculateCount(displayName, result)}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
        <View style={{ backgroundColor: 'white', display: 'flex', height: '100%' }}>
          <ScrollView style={{ display: 'flex', flex: 1 }}>
            {_.map(region, (section, index) => (
              <View key={`region_${index}`}>{this.renderRegions(section, result, is_first)}</View>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  }

  render() {
    const { navigation, indexData } = this.props;
    const { title } = indexData;
    const { profile_name, viewDeep, next = false, isIndex = false, summrySearch } = this.state;
    return isIndex === true ? (
      <IndexScreen
        {...this.props}
        summrySearch={summrySearch}
        backAction={() => {
          this.setState({ isIndex: false });
        }}
      />
    ) : (
      <Container style={{ backgroundColor: themes.fill_body, paddingBottom: 125 }}>
        <StyledHeader>
          <Left style={{ flex: 1 }}>
            {JMKX_PROFILE.OTC.includes(profile_name) && viewDeep === 1 && next ? (
              <Button transparent onPress={() => this.gotoFront()}>
                <Icon name="ios-arrow-back" style={styles.icon} />
              </Button>
            ) : (
              <Button transparent onPress={() => navigation.navigate('DrawerOpen')}>
                <Icon name="menu" style={styles.icon} />
              </Button>
            )}
          </Left>
          <Body style={{ flex: 1, alignItems: 'center' }}>
            <Title style={{ color: themes.title_text_color }}>{title}</Title>
          </Body>
          <Right />
        </StyledHeader>
        {this.renderContent()}
      </Container>
    );
  }
}

const select = (state) => ({
  token: state.settings.token,
  objectDescription: state.settings.objectDescription,
  permission: state.settings.permission,
  profile: state.settings.profile,
});
const act = (dispatch, { navigation }) => {
  const key = _.get(navigation, 'state.key');
  return {
    actions: bindActionCreators(
      {
        layoutAction: requestLayout,
        queryRecordListAction,
        setCacheLayout,
        needRefreshAttendee,
        clearQuery: clearQuery(key),
      },
      dispatch,
    ),
  };
};

export default connect(select, act)(OTCIndexScreen);

const styles = StyleSheet.create({
  switchContainer: {
    height: 38,
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  icon: {
    color: themes.title_icon_color,
    fontSize: themes.font_header_size,
  },

  header_title: {
    justifyContent: 'center',
    flexDirection: 'column',
    alignContent: 'center',
    alignItems: 'center',
    paddingBottom: 10,
    paddingTop: 10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    backgroundColor: 'white',
  },
  header_content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 20,
    alignContent: 'center',
    alignItems: 'center',
  },
  content_item: {
    paddingLeft: 6,
    paddingRight: 6,
    alignContent: 'center',
    alignItems: 'center',
  },
  display_item: {},
  item_title: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 20,
  },
  item_content: {
    padding: 20,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
    alignItems: 'center',
  },
});
