/* eslint-disable */
/**
 * @flow
 */

import React from 'react';
import { Container, Header, Text, Left, Body, Right, Button, Icon, Title } from 'native-base';
import { View, StyleSheet, Image, WebView, ScrollView } from 'react-native';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import _ from 'lodash';
import QueryComposer from 'fc-common-lib/query-composer';
import { queryMultipleRecordList, clearQuery } from '../../actions/query';
import LoadingScreen from '../common/LoadingScreen';
import themes from '../common/theme';
import { getQueryInitialState } from '../common/helpers/QueryHelper';
import IntlUtils from '../../services/intlUtils';
import * as Util from '../../utils/util';
import WebPage from './other-view/web';
import { AndroidWebviewScrollView } from '../../lib/androidWebview';
import Carousel from './components/Carousel';
import TabObjects from './objects/TabObjects';
import ListObjects from './objects/ListObjects';
import Belt from './components/Belt';
import { HOME_QUERY_START, cacheComputedData } from '../../actions/newHome';
import AStorage from '../../utils/asStorage';
import HomeScreen from '../home/HomeScreen';
import { StyledHeader } from '../common/components';
import HttpRequest from '../../services/httpRequest';
import { hasPermissionMenu } from '../../utils/helpers/permission';
import LocalLog from '../../utils/LocalLog';
import { getApiNameFromData, getDrawerName } from '../../utils/routeUtil';
import theme from '../../utils/theme';
import I18n from '../../i18n';
import HomePart from '../../components/home/Part';
import ObjectPart from '../../components/home/ObjectPart';

type Props = {
  navigation: any,
  token: string,
  userInfo: any,
  actions: any,
  crmPowerSetting: any,
  permission: any,
  profile: any,
  objectDescription: any,
  intlAllLan: any,
  intlType: any,
  cacheSetting: any,
  dispatch: (Object) => void,
  homeData: any,
  homeConfig: any,
  tabs: any,
};

type States = {
  navigation: Object,
  queryState: boolean,
  noReadCounts: number,
  isRefreshing: boolean,
  queryConditions: Object,
  homeData: Object,
  homeConfig: {
    title_config: Object,
  },
};

class NewHomeScreen extends React.Component<Props, States> {
  scrollOffsize: number;
  homeConfig: Object;
  localLogCallback: Function = null;
  headerLogs: string = '';
  queryConditions: Object = {};

  state = {
    navigation: this.props.navigation,
    queryConditions: {},
    homeData: [],
    isRefreshing: false,
    homeConfig: {},
    queryState: false,
    noReadCounts: 0,
    contentWidth: 0,
    contentHeight: 0,
  };

  async componentDidMount() {
    this.scrollOffsize = 0;
    this.homeConfig = _.get(this.props, 'homeConfig', {});

    const { token, navigation, intlAllLan, intlType } = this.props;
    //* 首页性能监控
    //TODO 不好拆分首页service 暂时写进业务层,后期重构首页
    const { uuid, processBegin, storageEnd } = LocalLog.storageBegin();
    this.localLogCallback = storageEnd;
    this.headerLogs = LocalLog.jointLogParams({ uuid, objectApiName: 'home', processBegin });

    await IntlUtils.loadIntlCaches({ intlAllLan, intlType });

    this.queryConditions = this.makeConditions(this.homeConfig);
    this.requestNoReadMsgNums(global.FC_CRM_USERID);
    const { realCondition } = this.queryConditions;

    const payload = {
      head: { token },
      body: realCondition,
    };
    const params = {
      payload,
      queryState: this.state.queryState,
    };
    if (!this.state.queryState) {
      this.props.dispatch({
        type: HOME_QUERY_START,
        payload: params,
      });
    } else {
      const { objects } = this.queryConditions;
      AStorage.save('homeQueryConditions', this.queryConditions);
      const homeData = this.combineHomeData(this.props.homeData, objects);
      this.setState({
        homeData,
        navigation,
        homeConfig: this.homeConfig,
        queryState: true,
        isRefreshing: false,
      });
    }
    this.refresh(); //
  }

  static getDerivedStateFromProps(props, state) {
    const { queryConditions = {}, queryState } = state;
    const { objects } = queryConditions;
    const { actions } = props;

    const homeConfig = _.get(props, 'homeConfig', {});
    if (props.homeData !== state.homeData && (!_.isEmpty(props.homeData) || queryState)) {
      const homeData = [];
      let dataArray = [];
      if (objects && props.homeData) {
        for (const homeDataIndex in props.homeData) {
          dataArray = _.concat(dataArray, props.homeData[homeDataIndex]);
        }
        //console.log('the data array is====>', dataArray);
        for (const objectIndex in objects) {
          const conditions = objects[objectIndex];
          const objectData = {
            api_name: objectIndex,
            dataList: [],
          };
          if (dataArray.length > 0 && conditions && conditions.length > 0) {
            _.each(dataArray, (data) => {
              _.each(conditions, (condition) => {
                const { object_describe_name } = data;
                const { objectApiName, criterias = [] } = condition;
                if (objectApiName === object_describe_name) {
                  let is_have = true;
                  let flag = true;
                  // TODO: 重写逻辑
                  _.each(criterias, (cri) => {
                    const field = _.get(cri, 'field', '');
                    const value = _.get(cri, 'value', []);
                    const operator = _.get(cri, 'operator', '');
                    if (operator === '>') {
                      is_have = data[field] > value;
                      if (is_have == false) {
                        flag = false;
                      }
                    } else if (operator === '<') {
                      is_have = data[field] < value;
                      if (is_have == false) {
                        flag = false;
                      }
                    } else if (
                      operator === 'contains' &&
                      _.isArray(data[field]) &&
                      _.isArray(value)
                    ) {
                      // data[field] and value should be array.
                      is_have = _.some(value, (item) => data[field].includes(item)); // value 是简档数组，data[field] 是数据的可查权限数组
                      if (is_have == false) {
                        flag = false;
                      }
                    } else {
                      if (_.toString(value).indexOf(_.toString(data[field])) < 0) {
                        is_have = false;
                      }
                    }
                  });
                  if (is_have && flag) {
                    let have_in_list = false;
                    _.each(objectData.dataList, (listData) => {
                      if (listData.id === data.id) {
                        have_in_list = true;
                      }
                    });
                    if (!have_in_list) {
                      objectData.dataList.push(data);
                    }
                  }
                }
              });
            });
          }
          homeData.push(objectData);
        }
      }
      actions.cacheComputedHomeData(homeData);
      return {
        homeData,
        navigation: props.navigation,
        queryState: true,
        homeConfig,
        isRefreshing: false,
      };
    } else {
      //登陆罗诊时homeConfig为空，走旧版首页组件
      return {
        queryState: true,
        isRefreshing: false,
        navigation: props.navigation,
      };
    }
  }

  combineHomeData = (propsHomeData, objects) => {
    const homeData = [];
    let dataArray = [];
    for (const homeDataIndex in propsHomeData) {
      dataArray = _.concat(dataArray, propsHomeData[homeDataIndex]);
    }
    for (const objectIndex in objects) {
      const conditions = objects[objectIndex];
      const objectData = {
        api_name: objectIndex,
        dataList: [],
      };
      if (dataArray.length > 0 && conditions && conditions.length > 0) {
        _.each(dataArray, (data) => {
          _.each(conditions, (condition) => {
            const { object_describe_name } = data;
            const { objectApiName, criterias = [] } = condition;
            if (objectApiName === object_describe_name) {
              let is_have = true;
              let flag = true;
              _.each(criterias, (cri) => {
                const field = _.get(cri, 'field', '');
                const value = _.get(cri, 'value', []);
                const operator = _.get(cri, 'operator', '');
                if (operator === '>') {
                  is_have = data[field] > value;
                  if (is_have == false) {
                    flag = false;
                  }
                } else if (operator === '<') {
                  is_have = data[field] < value;
                  if (is_have == false) {
                    flag = false;
                  }
                } else {
                  if (_.toString(value).indexOf(_.toString(data[field])) < 0) {
                    is_have = false;
                  }
                }
              });
              if (is_have && flag) {
                let have_in_list = false;
                _.each(objectData.dataList, (listData) => {
                  if (listData.id === data.id) {
                    have_in_list = true;
                  }
                });
                if (!have_in_list) {
                  objectData.dataList.push(data);
                }
              }
            }
          });
        });
      }
      homeData.push(objectData);
    }
    return homeData;
  };

  async requestNoReadMsgNums(userId) {
    const { resultCount } = await HttpRequest.query({
      token: this.props.token,
      objectApiName: 'alert',
      criteria: [
        {
          field: 'owner',
          operator: '==',
          value: [userId],
        },
        { field: 'status', operator: '==', value: [0] },
      ],
      joiner: 'and',
      orderBy: 'create_time',
      order: 'desc',
      pageSize: 10000,
      pageNo: 1,
    });
    this.setState({ noReadCounts: resultCount });
  }

  makeConditions = (homeConfig) => {
    const { extenders_config = [] } = homeConfig;
    const objectsCondition = {};
    const realQueryCondition = [];
    _.each(extenders_config, (componentConfig) => {
      const { extender_type, show_in_devices = [], content } = componentConfig;
      let is_show = false;
      if (show_in_devices.length === 0) {
        is_show = true;
      }
      _.each(show_in_devices, (showFlag) => {
        if (showFlag === 'cellphone') {
          is_show = true;
        }
      });
      if (extender_type === 'objects' && is_show) {
        const { display_items = [] } = content;
        _.each(display_items, (items) => {
          const { item_api, show_in_devices = [], ref_objects = [] } = items;
          objectsCondition[`${item_api}`] = [];
          if (ref_objects.length > 0) {
            _.each(ref_objects, (objectCondition) => {
              const {
                render_style = {},
                api_name,
                critirias = [],
                hidden_expression = 'return false',
                extra_query_condition = [],
                joiner = 'and',
                orderBy = 'create_time',
                order = 'desc',
                pageNo = 1,
                pageSize = 100,
              } = objectCondition;

              const is_hidden = Util.executeExpression(hidden_expression);

              if (!is_hidden) {
                const newCritirias = [];
                if (critirias.length > 0) {
                  _.each(critirias, (cri) => {
                    const value = _.get(cri, 'value', '');
                    if (_.isObject(value) && cri && _.get(value, 'type', '') === 'js') {
                      const realValue = Util.executeExpression(
                        _.get(value, 'expression', 'return false'),
                      );
                      newCritirias.push({
                        field: _.get(cri, 'field', ''),
                        operator: _.get(cri, 'operator', 'in'),
                        value: _.isArray(realValue) ? realValue : [realValue],
                      });
                    } else {
                      newCritirias.push(cri);
                    }
                  });
                }
                const queryItem = {
                  objectApiName: api_name,
                  criterias: newCritirias,
                  joiner,
                  orderBy,
                  order,
                  pageNo,
                  pageSize,
                };
                const item = {
                  ...queryItem,
                  render_style,
                };
                if (extra_query_condition.length > 0) {
                  _.each(extra_query_condition, (extraQuery) => {
                    const { value = [] } = extraQuery;
                    const extValue = [];
                    _.each(value, (val) => {
                      if (val && val.value && val.value.type === 'js') {
                        const realValue = Util.executeExpression(
                          _.get(val.value, 'expression', 'return false'),
                        );
                        extValue.push({
                          field: _.get(val, 'field', ''),
                          operator: _.get(val, 'operator', 'in'),
                          value: _.isArray(realValue) ? realValue : [realValue],
                        });
                      } else {
                        extValue.push(val);
                      }
                    });
                    queryItem[`${extraQuery.name}`] = extValue;
                  });
                }
                objectsCondition[`${item_api}`].push(item);
                realQueryCondition.push(queryItem);
              }
            });
          }
        });
      }
    });

    return { objects: objectsCondition, realCondition: realQueryCondition };
  };

  refresh = () => {
    this.setState({
      isRefreshing: true,
    });
    const { token } = this.props;
    const { realCondition } = this.queryConditions;

    this.setState({
      queryConditions: this.queryConditions,
    });
    const payload = {
      head: { token },
      body: realCondition,
    };

    //TODO 发现saga 获取 queryState 方式有错，暂时不做修改（看首页都看晕了）
    const actionObj = {
      type: HOME_QUERY_START,
      payload: {
        payload,
        queryState: false,
      },
      headerLogs: undefined,
      callback: undefined,
    };

    // * newhome 性能监控， header 接收 headerLogs 参数
    if (!_.isEmpty(realCondition) && this.headerLogs) {
      //* 当获取到数据且为第一次首页渲染时，储存性能log
      const _logCallback = () => {
        _.isFunction(this.localLogCallback) &&
          this.localLogCallback({ objectApiName: 'home', layoutApiName: 'home' });
      };
      actionObj.headerLogs = this.headerLogs;
      actionObj.callback = _logCallback;

      this.headerLogs = '';
    }
    this.props.dispatch(actionObj);
  };

  //* title 支持imgae
  renderTitleImage = (config: { name: string, title_style: Object }) => {
    const image_url = _.get(config, 'image_info.url');
    const imageStyle = _.get(config, 'image_info.style');
    const resizeMode = _.get(config, 'image_info.resizeMode', 'contain');

    if (!image_url) {
      return (
        <Title style={config.title_style ? config.title_style : { color: themes.title_text_color }}>
          {config.name}
        </Title>
      );
    } else {
      return (
        <Image
          source={{
            uri: image_url,
          }}
          style={imageStyle || styles.titleImage}
          resizeMode={resizeMode}
        />
      );
    }
  };

  renderContent() {
    const { homeConfig } = this.props;
    const {
      navigation,
      queryConditions,
      homeData,
      queryState = false,
      isRefreshing = false,
    } = this.state;
    const { extenders_config = [] } = homeConfig;

    if (!_.isEmpty(extenders_config)) {
      return (
        <AndroidWebviewScrollView
          scrollEventThrottle={200}
          wp={this.wp}
          automaticallyAdjustContentInsets={false}
          directionalLockEnabled
          alwaysBounceVertical={false}
        >
          {_.map(extenders_config, (extender, index) => {
            const showInDevices = _.get(extender, 'show_in_devices', []);
            let device_show = false;
            _.each(showInDevices, (deviceName) => {
              if (deviceName === 'cellphone') {
                device_show = true;
              }
            });
            const { hidden_expression = 'return false' } = extender;
            const isHidden = Util.executeExpression(hidden_expression);
            if ((device_show || showInDevices.length === 0) && !isHidden) {
              const type = extender.extender_type;
              const content = _.get(extender, 'content', {});
              if (type === 'component') {
                const compType = _.get(content, 'api_name', '');
                const height = _.get(content, 'height');
                const { display_items = [] } = content;
                //先判断是否要渲染该组件
                const shouldRenderItems = [];
                _.each(display_items, (item) => {
                  const { hidden_expression = 'return false' } = item;
                  const isHidden2 = Util.executeExpression(hidden_expression);
                  if (!isHidden2) {
                    shouldRenderItems.push(item);
                  }
                });
                if (compType === 'carousel') {
                  return shouldRenderItems.length > 0
                    ? this.renderCarousel(index, content, this.props, queryConditions, homeData)
                    : null;
                } else if (compType === 'belt') {
                  return shouldRenderItems.length > 0
                    ? this.renderQuickEntrances(
                        index,
                        content,
                        this.props,
                        queryConditions,
                        homeData,
                      )
                    : null;
                } else {
                  return (
                    <View key={`component${index}`}>
                      <Text>{I18n.t('NewHomeScreen.IncorrectComponent')}</Text>
                    </View>
                  );
                }
              } else if (type === 'objects') {
                return this.renderObjects(
                  index,
                  content,
                  this.props,
                  queryConditions,
                  homeData,
                  queryState,
                );
              } else if (type === 'web') {
                return Util.executeDetailExp(hidden_expression)
                  ? null
                  : this.renderExternalPage(index, content);
              }
            }
          })}
        </AndroidWebviewScrollView>
      );
    } else {
      return <LoadingScreen />;
    }
  }

  renderCarousel(key, content, parentProps, conditions, homeData) {
    return (
      <HomePart key={`carousel${key}`} style={{ padding: 0 }}>
        <Carousel
          style={{ height: _.get(content, 'height', 150) }}
          data={_.get(content, 'display_items')}
          autoplay
        />
      </HomePart>
    );
  }

  renderQuickEntrances(key, content, parentProps, conditions, homeData) {
    const itemsAllowed = _.get(content, 'display_items').filter(
      (item) => !Util.executeExpression(item.hidden_expression),
    );

    return (
      <HomePart key={`quickEntrance${key}`} style={{ paddingHorizontal: 0 }}>
        <Belt data={itemsAllowed} parentParam={this.props} />
      </HomePart>
    );
  }

  renderObjects(key, content, ...params) {
    switch (_.get(content, 'style')) {
      case 'tabs':
        return this.renderTabObject(key, content, ...params);
      case 'list':
        return this.renderListObject(key, content, ...params);
      default:
        return this.renderListObject(key, content, ...params);
    }
  }

  renderTabObject(key, content, parentProps, conditions, homeData, queryState) {
    return (
      <TabObjects
        key={`tab${key}`}
        content={content}
        parentParam={this.props}
        queryConditions={conditions}
        homeData={homeData}
        queryState={queryState}
        onMainListItemUpdate={this.refresh}
      />
    );
  }

  renderListObject(key, content, parentProps, conditions, homeData, queryState) {
    return (
      <ListObjects
        key={`list${key}`}
        content={content}
        parentParam={this.props}
        queryConditions={conditions}
        homeData={homeData}
        queryState={queryState}
        onMainListItemUpdate={this.refresh}
      />
    );
  }

  renderExternalPage(key, content = {}) {
    const { params = [], label = '', ref_url: url = '' } = content;

    return (
      <View key={`external_page${key}`} ref={(ref) => (this.wp = ref)}>
        <ScrollView>
          <WebPage
            external_page_src={
              url + '?' + QueryComposer.fromObjectArray(params, Util.executeDetailExp)
            }
            width={this.state.contentWidth}
            height={this.state.contentHeight}
          />
        </ScrollView>
      </View>
    );
  }

  renderLoading = () => {
    const { navigation } = this.props;
    return (
      <Container style={{ backgroundColor: themes.fill_base }}>
        <StyledHeader style={{ backgroundColor: theme.headerBackground }}>
          <Left style={{ flex: 1 }}>
            <Button transparent onPress={() => navigation.navigate('DrawerOpen')}>
              <Icon name="menu" style={styles.icon} fontSize={40} />
            </Button>
          </Left>
          <Body style={{ flex: 1, alignItems: 'center' }} />
          <Right />
        </StyledHeader>
        <LoadingScreen />
      </Container>
    );
  };

  getRightActionApiName() {
    const {
      tabs: { items },
      permission,
    } = this.props;
    const alertMenu = hasPermissionMenu(items, permission).find(
      (item) => item.object_describe_api_name === 'alert',
    );

    return alertMenu ? getDrawerName(getApiNameFromData(alertMenu), alertMenu.record_type) : '';
  }

  measureContent = ({ nativeEvent }) => {
    const { width, height } = nativeEvent.layout;
    this.setState({ contentWidth: width, contentHeight: height });
  };

  render() {
    const { navigation, homeConfig, queryState } = this.state;
    const { title_config } = homeConfig;
    const rightActionApiName = this.getRightActionApiName();

    if (homeConfig === '') {
      return this.renderLoading();
    }

    return _.isEmpty(homeConfig) === true && queryState ? (
      <HomeScreen {...this.props} />
    ) : (
      <Container style={{ backgroundColor: theme.appBackground }}>
        <StyledHeader style={{ backgroundColor: theme.headerBackground }}>
          <Left style={{ flex: 1 }}>
            <Button transparent onPress={() => navigation.navigate('DrawerOpen')}>
              <Icon name="ios-menu" style={styles.icon} fontSize={50} />
            </Button>
          </Left>
          <Body style={{ flex: 1, alignItems: 'center' }}>
            {!!title_config &&
              (title_config.type === 'text' ? (
                <Title
                  style={
                    title_config.title_style
                      ? title_config.title_style
                      : { color: themes.title_text_color }
                  }
                >
                  {title_config.name}
                </Title>
              ) : (
                this.renderTitleImage(title_config)
              ))}
          </Body>
          <Right>
            {/* 当前 RN Android JSX 中会将 0 '' 这样的 JS 逻辑假值判别为合法的 JSX 元素渲染。
            所以再写条件控制渲染的时候，不要将的逻辑判断结果作为条件，而应当转化为 boolean 值
            ps: 抽离函数是不可行的，因为是在构建原生组件的时候抛出的异常，所以判定和 JSX 的写法无关。
            */}
            {!!rightActionApiName && (
              <React.Fragment>
                <Button
                  style={{ paddingRight: 12 }}
                  transparent
                  onPress={() => {
                    navigation.navigate(rightActionApiName);
                  }}
                >
                  <Icon name="ios-mail-outline" style={styles.icon} />
                </Button>
                {this.state.noReadCounts > 0 && <View style={styles.unReadPoint} />}
              </React.Fragment>
            )}
          </Right>
        </StyledHeader>
        <View style={{ flex: 1 }} onLayout={this.measureContent}>
          {this.renderContent()}
        </View>
      </Container>
    );
  }

  measureContent = ({ nativeEvent }) => {
    const { x, y, width, height } = nativeEvent.layout;
    this.setState({ contentWidth: width, contentHeight: height });
  };
}

const select = (state, screen) => {
  const query = getQueryInitialState({ state, screen });
  return {
    token: state.settings.token,
    userInfo: state.settings.userInfo,
    crmPowerSetting: state.settings.crmPowerSetting,
    intlAllLan: state.settings.intlAllLan,
    intlType: state.settings.intlType,
    objectDescription: state.settings.objectDescription,
    profile: state.settings.profile,
    permission: state.settings.permission,
    homeData: _.get(state.home, 'listObjects', {}),
    dataLoading: query.loading,
    dataError: query.error,
    homeConfig: state.settings.homeConfig,
    cacheSetting: state.settings,
    tabs: state.settings.tabs,
  };
};

const act = (dispatch, { navigation }) => {
  const key = _.get(navigation, 'state.key');
  return {
    actions: bindActionCreators(
      {
        queryMultipleRecordList: queryMultipleRecordList(key),
        clearQuery: clearQuery(key),
        cacheComputedHomeData: cacheComputedData,
      },
      dispatch,
    ),
    dispatch,
  };
};

export default connect(select, act)(NewHomeScreen);

const styles = StyleSheet.create({
  arrowTop: {
    position: 'absolute',
    right: themes.deviceWidth * 0.07,
    bottom: themes.deviceHeight * 0.05,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderColor: themes.border_color_base,
    borderWidth: themes.borderWidth,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  icon: {
    color: themes.title_icon_color,
    fontSize: themes.font_header_size,
  },
  lineSpace: {
    backgroundColor: '#EAF2F6',
    paddingBottom: 10,
  },
  lineNoData: {
    backgroundColor: 'white',
    paddingBottom: 10,
  },
  titleImage: {
    width: 100,
    height: 50,
  },
  unReadPoint: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: 'red',
    position: 'absolute',
    top: 10,
    right: 2,
  },
});
