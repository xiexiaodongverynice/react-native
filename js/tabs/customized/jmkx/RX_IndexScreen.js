/*eslint-disable */
import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  Container,
  Header,
  Text,
  Left,
  Body,
  Right,
  Button,
  Icon,
  Title,
  Content,
} from 'native-base';
import { View, StyleSheet, DeviceEventEmitter, ScrollView } from 'react-native';
import { getInitDisplayNames, getInitRegion } from './helpers';
import { JMKX_PROFILE } from './utils';
import themes from '../../common/theme';
import requestLayout, { setCacheLayout } from '../../../actions/pageLayout';
import { queryRecordListAction, clearQuery } from '../../../actions/query';
import { needRefreshAttendee } from '../../../actions/event';
import IndexScreen from '../../IndexScreen';
import IndexDataParser from '../../../services/dataParser';
import { StyledHeader } from '../../common/components';
import I18n from '../../../i18n';

class RXIndexScreen extends React.Component {
  static propTypes = {
    profile: PropTypes.any,
    indexData: PropTypes.any,
    navigation: PropTypes.any,
    is_first: PropTypes.any,
  };
  state = {
    profile_name: 'rx_gm',
    viewDeep: 0,
    next: false,
    isIndex: false,
    region: [],
    initRegion: [],
    result: [],
    displayName: [],
    initDisplayNames: [],
    summrySearch: {},
  };

  componentDidMount() {
    const { profile, indexData } = this.props;
    const { api_name } = profile;
    const { title } = indexData;
    // rx_gm、rx_ka_rsd、rx_medical_rsd 第一层全国总、副总，  rx_ka_rsm、rx_medical_rsm 第二层 省区经理、大区经理
    const initDisplayNames = getInitDisplayNames(api_name, title);
    const initRegion = getInitRegion(api_name);
    this.setState({
      initDisplayNames,
      initRegion,
    });
    if (api_name !== 'rx_gm') {
      this.setState({
        profile_name: api_name,
        next: true,
      });
    }
  }

  static getDerivedStateFromProps(props, state) {
    const {
      navigation,
      indexData: { dutyName, profile_name, menuData },
      screenInfo = {},
      objectDescription,
      profile,
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
    const is_first = false;
    _.each(result, (rst) => {
      if (
        rst.belonged_first_level_territory &&
        !region.includes(rst.belonged_first_level_territory)
      ) {
        region.push(rst.belonged_first_level_territory);
      }
      displayField = _.get(rst, 'display_name', '');
    });
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
    return {
      isIndex,
      next,
      viewDeep,
      region,
      result,
      displayNames,
      is_first,
    };
  }

  gotoFront = () => {
    this.setState({
      next: false,
      viewDeep: 0,
    });
  };

  gotoIndex = (regionText, regionResult) => {
    const { profile, indexData } = this.props;
    const { api_name } = profile;
    let belonged_product_line = [];
    if (api_name == 'rx_gm') {
      belonged_product_line = ['rx', 'rx_ka', 'rx_me', 'rx_mkt'];
    } else if (api_name == 'rx_medical_rsd') {
      belonged_product_line = ['rx_me'];
    } else if (api_name == 'rx_ka_rsd') {
      belonged_product_line = ['rx_ka', 'rx_mkt'];
    }
    const summrySearch = {
      belonged_first_level_territory: regionText,
      belonged_product_line,
    };
    this.setState({
      isIndex: true,
      summrySearch,
    });
  };

  renderRegions = (regionText, result) => {
    const { next, displayNames = [], initDisplayNames = [] } = this.state;
    let renderDisplayNames = [];
    renderDisplayNames = displayNames.length ? displayNames : initDisplayNames;
    let total = 0;
    const regionResult = [];
    _.each(result, (rst) => {
      const belonged_first_level_territory = _.get(rst, 'belonged_first_level_territory', '');
      if (belonged_first_level_territory === regionText) {
        const count = _.get(rst, 'count', 0);
        total += count;
        regionResult.push(rst);
      }
    });
    return (
      <View style={styles.display_item}>
        <View style={styles.item_title}>
          <Text style={{ fontWeight: '300' }}>{regionText}</Text>
          <View style={{ flexDirection: 'row', alignContent: 'center', alignItems: 'center' }}>
            <Button
              transparent
              onPress={() => {
                this.gotoIndex(regionText, regionResult);
              }}
            >
              <Text style={{ fontWeight: '300', color: 'black' }}>{total}</Text>
              <Icon name="ios-arrow-forward" style={{ color: '#ccc' }} />
            </Button>
          </View>
        </View>
        <View style={styles.item_content}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {_.map(renderDisplayNames, (displayName, index) => {
              return (
                <View key={`key_dis_${index}`} style={styles.content_item}>
                  <Text style={{ fontSize: 12, fontWeight: '100', color: '#696969' }}>
                    {displayName}
                  </Text>
                  <Text style={{ fontSize: 14, paddingTop: 10 }}>
                    {this.calculateCount(displayName, regionResult)}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    );
  };

  calculateCount = (displayName, regionResult) => {
    let total = 0;
    _.each(regionResult, (rst) => {
      const display_name = _.get(rst, 'display_name', '');

      if (displayName === rst[`${display_name}`]) {
        total += rst.count;
      }
    });
    return total;
  };

  renderContent = () => {
    const {
      next = false,
      viewDeep,
      region = [],
      initRegion = [],
      result = [],
      displayNames = [],
      initDisplayNames = [],
      is_first,
    } = this.state;
    let total = 0;
    _.each(result, (rst) => {
      total += rst.count;
    });
    let renderRegions = [];
    let renderDisplayNames = [];
    renderRegions = region.length ? region : initRegion;
    renderDisplayNames = displayNames.length ? displayNames : initDisplayNames;
    return (
      <View style={{ flex: 1 }}>
        <View style={{ marginBottom: 15 }}>
          <View style={styles.header_title}>
            <Text style={{ fontSize: 12, fontWeight: '100', color: '#696969' }}>
              {I18n.t('RX_IndexScreen.Text.Total')}
            </Text>
            <Text style={{ fontSize: 20 }}>{total}</Text>
          </View>
          <View style={styles.header_content}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {_.map(renderDisplayNames, (displayName, index) => {
                return (
                  <View key={`RX_desp_${index}`} style={styles.content_item}>
                    <Text style={{ fontSize: 12, fontWeight: '100', color: '#696969' }}>
                      {displayName}
                    </Text>
                    <Text style={{ fontSize: 20 }}>{this.calculateCount(displayName, result)}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
        <View style={{ backgroundColor: 'white', flex: 1 }}>
          <ScrollView style={{ flex: 1 }}>
            {_.map(renderRegions, (section, index) => {
              return <View key={`region_${index}`}>{this.renderRegions(section, result)}</View>;
            })}
          </ScrollView>
        </View>
      </View>
    );
  };

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
      <Container style={{ backgroundColor: themes.fill_body }}>
        <StyledHeader>
          <Left style={{ flex: 1 }}>
            <Button transparent onPress={() => navigation.navigate('DrawerOpen')}>
              <Icon name="menu" style={styles.icon} />
            </Button>
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

export default connect(select, act)(RXIndexScreen);

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
