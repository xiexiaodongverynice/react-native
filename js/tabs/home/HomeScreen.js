/*  eslint-disable */
/**
 *Created by Guanghua on 12/20;
 @flow
 */
import React from 'react';
import { Container, Header, Text, Left, Body, Right, Button, Icon, Title } from 'native-base';
import { View, StyleSheet, DeviceEventEmitter } from 'react-native';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import _ from 'lodash';
import I18n from '../../i18n/index';
import Globals from '../../utils/Globals';
import { queryMultipleRecordList, createCriteria, clearQuery } from '../../actions/query';
import LoadingScreen from '../common/LoadingScreen';
import ErrorScreen from '../common/ErrorScreen';
import HomeList from './HomeList';
import themes from '../common/theme';
import { getQueryInitialState } from '../common/helpers/QueryHelper';
import HttpRequest from '../../services/httpRequest';
import { TENANT_ID_COLLECT } from '../../utils/const';
import { intlValue } from '../../utils/crmIntlUtil';
import IntlUtils from '../../services/intlUtils';
import { StyledHeader } from '../common/components';
import { hasPermissionMenu } from '../../utils/helpers/permission';
import LocalLog from '../../utils/LocalLog';

type Prop = {
  actions: any,
  token: string,
  userInfo: any,
  homeData: any,
  dataError: any,
  dataLoading: any,
  objectDescription: any,
  navigation: any,
  cacheSetting: any,
};

type State = {
  noReadCounts: number,
};

class HomeScreen extends React.Component<Prop, State> {
  state = {
    noReadCounts: 0,
  };

  localLogCallback = null;

  async componentDidMount() {
    const {
      token,
      userInfo,
      actions,
      crmPowerSetting,
      permission,
      profile,
      objectDescription,
      cacheSetting,
    } = this.props;
    const { intlAllLan = {}, intlType = '' } = cacheSetting;
    // const userId = _.get(userInfo, 'id');
    //* 首页性能监控
    //TODO 不好拆分首页service 暂时写进业务层,后期重构首页
    const { uuid, processBegin, storageEnd } = LocalLog.storageBegin();
    this.localLogCallback = storageEnd;
    const headerLogs = LocalLog.jointLogParams({ uuid, objectApiName: 'home', processBegin });

    await IntlUtils.loadIntlCaches({ intlAllLan, intlType });
    // await Promise.all([
    //   Globals.setGlobalCRMSettings(
    //     crmPowerSetting,
    //     userId,
    //     token,
    //     userInfo,
    //     profile,
    //     permission,
    //     objectDescription,
    //     cacheSetting,
    //   ),
    //   IntlUtils.loadIntlCaches({ intlAllLan, intlType }),
    // ]);
    console.log('headerLogs==>', headerLogs);
    this.homeDataInit(headerLogs);
    this.eventListener = DeviceEventEmitter.addListener('BackHomePageEvent', (a) => {
      this.homeDataInit();
    });
  }

  async homeDataInit(headerLogs = {}) {
    const { token, userInfo, actions } = this.props;
    const userId = _.get(userInfo, 'id');

    const subordinateIds = fc_getSubordinateIds();
    const subordinateIdsandUserIdArrayString = [];
    _.map(subordinateIds, (item) => {
      subordinateIdsandUserIdArrayString.push(item);
    });
    subordinateIdsandUserIdArrayString.push(userId);
    const tenantId = userInfo.tenant_id;
    const subordinates = fc_getSubordinates() || [];
    const directSubordinates = [];
    _.each(subordinates, (subor) => {
      const parent_id = _.get(subor, 'parent_id', undefined);
      if (parent_id && parent_id == userId) {
        if (subor.id) {
          directSubordinates.push(subor.id);
        }
      }
    });
    if (TENANT_ID_COLLECT.JMKX_TENEMENT.includes(tenantId) && directSubordinates.length > 0) {
      await this.queryDataForOther(
        actions,
        token,
        userId,
        directSubordinates,
        tenantId,
        headerLogs,
      );
    } else if (TENANT_ID_COLLECT.MYLAN_TENEMENT.includes(tenantId)) {
      await this.queryDataForMylan(
        actions,
        token,
        userId,
        subordinateIdsandUserIdArrayString,
        tenantId,
        headerLogs,
      );
    } else {
      await this.queryDataForOther(
        actions,
        token,
        userId,
        subordinateIdsandUserIdArrayString,
        tenantId,
        headerLogs,
      );
    }

    this.requestNoReadMsgNums(userId);
  }

  queryDataForMylan = async (
    actions,
    token,
    userId,
    subordinateIdsandUserIdArrayString,
    headerLogs,
  ) => {
    const profile = fc_getProfile();
    let criterias = [];
    let body = [];
    let mylanBody = [
      {
        criterias: [
          {
            field: 'status',
            operator: 'in',
            value: ['application_approved', 'hx_approved'],
          },
          { field: 'create_by', operator: '==', value: [userId] },
          {
            field: 'my_time_begin',
            operator: '>',
            value: [new Date().setHours(0, 0, 0, 0)],
          },
          {
            field: 'my_time_begin',
            operator: '<',
            value: [new Date().setHours(24, 0, 0, 0)],
          },
        ],
        objectApiName: 'my_event',
        joiner: 'and',
        pageSize: 100,
        pageNo: 1,
      },
      {
        objectApiName: 'notice',
        criterias: [
          {
            field: 'profiles',
            operator: 'contains',
            value: ['$$CurrentProfileId$$'],
          },
          {
            field: 'expire_date',
            operator: '>',
            value: [new Date().getTime()],
          },
        ],
        orderBy: 'publish_date',
        order: 'desc',
        joiner: 'and',
        pageSize: 100,
        pageNo: 1,
      },
    ];
    if (profile.api_name === 'my_procurement_01_profile') {
      criterias = [
        {
          field: 'status',
          operator: 'in',
          value: ['proc_processed'],
        },
      ];
      body = [
        {
          criterias: criterias,
          objectApiName: 'my_event',
          joiner: 'and',
          pageSize: 100,
          pageNo: 1,
        },
        {
          criterias: criterias,
          objectApiName: 'my_vendor_approval',
          joiner: 'and',
          pageSize: 100,
          pageNo: 1,
        },
      ];
    } else if (profile.api_name === 'my_procurement_02_profile') {
      criterias = [
        {
          field: 'status',
          operator: 'in',
          value: ['proc_inquiry_sent', 'proc_price_compare'],
        },
      ];
      body = [
        {
          criterias: criterias,
          objectApiName: 'my_event',
          joiner: 'and',
          pageSize: 100,
          pageNo: 1,
        },
        {
          criterias: criterias,
          objectApiName: 'my_vendor_approval',
          joiner: 'and',
          pageSize: 100,
          pageNo: 1,
        },
      ];
    } else if (profile.api_name === 'my_procurement_03_profile') {
      criterias = [
        {
          field: 'status',
          operator: 'in',
          value: ['proc_director_approval'],
        },
      ];
      body = [
        {
          criterias: criterias,
          objectApiName: 'my_event',
          joiner: 'and',
          pageSize: 100,
          pageNo: 1,
        },
        {
          criterias: criterias,
          objectApiName: 'my_vendor_approval',
          joiner: 'and',
          pageSize: 100,
          pageNo: 1,
        },
      ];
    } else {
      body = [
        {
          criterias: [
            { field: 'create_by', value: [`${userId}`], operator: '==' },
            { field: 'status', value: ['proc_vendor_chosen'], operator: '==' },
          ],
          objectApiName: 'my_event',
          joiner: 'and',
          pageSize: 100,
          pageNo: 1,
        },
        {
          approvalCriterias: [
            { field: 'candidate_operators', value: [userId], operator: 'contains' },
            { field: 'status', value: ['waiting'], operator: '==' },
            { field: 'approval_flow__r.status', value: ['in_progress'], operator: 'in' },
          ],
          objectApiName: 'my_event',
          joiner: 'and',
          pageSize: 100,
          pageNo: 1,
        },
        {
          approvalCriterias: [
            { field: 'candidate_operators', value: [userId], operator: 'contains' },
            { field: 'status', value: ['waiting'], operator: '==' },
            { field: 'approval_flow__r.status', value: ['in_progress'], operator: 'in' },
          ],
          objectApiName: 'my_vendor_approval',
          joiner: 'and',
          pageSize: 100,
          pageNo: 1,
        },
        {
          criterias: [
            { field: 'create_by', value: [`${userId}`], operator: '==' },
            { field: 'status', value: ['proc_vendor_chosen'], operator: '==' },
          ],
          objectApiName: 'my_vendor_approval',
          joiner: 'and',
          pageSize: 100,
          pageNo: 1,
        },
        {
          approvalCriterias: [
            { field: 'candidate_operators', value: [userId], operator: 'contains' },
            { field: 'status', value: ['waiting'], operator: '==' },
            { field: 'approval_flow__r.status', value: ['in_progress'], operator: 'in' },
          ],
          objectApiName: 'my_promo_materials',
          joiner: 'and',
          pageSize: 100,
          pageNo: 1,
        },
        {
          approvalCriterias: [
            { field: 'candidate_operators', value: [userId], operator: 'contains' },
            { field: 'status', value: ['waiting'], operator: '==' },
            { field: 'approval_flow__r.status', value: ['in_progress'], operator: 'in' },
          ],
          objectApiName: 'customer',
          joiner: 'and',
          pageSize: 100,
          pageNo: 1,
        },
      ];
    }
    mylanBody = _.concat(mylanBody, body);
    const payload = {
      head: { token },
      body: mylanBody,
    };
    actions.queryMultipleRecordList(payload, headerLogs);
  };

  queryDataForOther = async (
    actions,
    token,
    userId,
    subordinateIdsandUserIdArrayString,
    tenantId,
    headerLogs,
  ) => {
    const allSubors = fc_getSubordinateIds('all') ? fc_getSubordinateIds('all') : [];
    const byUserSubors = fc_getSubordinateIds('by_user') ? fc_getSubordinateIds('by_user') : [];
    const payload = {
      head: { token },
      body: [
        {
          criterias: [
            {
              field: 'owner',
              operator: '==',
              value: [`${userId}`], // TENANT_ID_COLLECT.JMKX_TENEMENT.includes(tenantId) ? allSubors :
            },
            { field: 'status', operator: '==', value: [1] },
          ],
          objectApiName: 'coach_feedback',
          joiner: 'and',
        },
        {
          criterias: [
            { field: 'approver', operator: '==', value: [`${userId}`] },
            { field: 'status', operator: '==', value: [0] },
          ],
          objectApiName: 'segmentation_history',
          joiner: 'and',
        },
        {
          objectApiName: 'event',
          criterias: [
            {
              field: 'owner',
              operator: 'in',
              value: TENANT_ID_COLLECT.LUOZHEN_TENEMENT.includes(tenantId)
                ? [userId]
                : TENANT_ID_COLLECT.JMKX_TENEMENT.includes(tenantId)
                ? allSubors
                : subordinateIdsandUserIdArrayString,
            },
            { field: 'status', operator: '==', value: [1] },
            {
              field: 'start_time',
              operator: '>',
              value: [new Date().setHours(0, 0, 0, 0)],
            },
            {
              field: 'start_time',
              operator: '<',
              value: [new Date().setHours(24, 0, 0, 0)],
            },
          ],
          orderBy: 'start_time',
          order: 'desc',
          joiner: 'and',
        },
        {
          objectApiName: 'call',
          criterias: [
            {
              field: 'owner',
              operator: 'in',
              value: TENANT_ID_COLLECT.LUOZHEN_TENEMENT.includes(tenantId)
                ? [userId]
                : TENANT_ID_COLLECT.JMKX_TENEMENT.includes(tenantId)
                ? allSubors
                : subordinateIdsandUserIdArrayString,
            },
            {
              field: 'start_time',
              operator: '>',
              value: [new Date().setHours(0, 0, 0, 0)],
            },
            {
              field: 'start_time',
              operator: '<',
              value: [new Date().setHours(24, 0, 0, 0)],
            },
          ],
          orderBy: 'start_time',
          order: 'desc',
          joiner: 'and',
        },
        {
          objectApiName: 'time_off_territory',
          criterias: [
            {
              field: 'owner',
              operator: 'in',
              value: TENANT_ID_COLLECT.LUOZHEN_TENEMENT.includes(tenantId)
                ? [userId]
                : TENANT_ID_COLLECT.JMKX_TENEMENT.includes(tenantId)
                ? allSubors
                : subordinateIdsandUserIdArrayString,
            },
            {
              field: 'start_date',
              operator: '>',
              value: [new Date().setHours(0, 0, 0, 0)],
            },
            {
              field: 'start_date',
              operator: '<',
              value: [new Date().setHours(24, 0, 0, 0)],
            },
            {
              field: 'status',
              operator: '==',
              value: [1],
            },
          ],
          orderBy: 'start_date',
          order: 'desc',
          joiner: 'and',
        },
        {
          objectApiName: 'notice',
          criterias: [
            {
              field: 'profiles',
              operator: 'contains',
              value: ['$$CurrentProfileId$$'],
            },
            {
              field: 'expire_date',
              operator: '>',
              value: [new Date().getTime()],
            },
          ],
          orderBy: 'publish_date',
          order: 'desc',
          joiner: 'and',
          pageSize: 100,
          pageNo: 1,
        },
      ],
    };
    const luozhenExtBody = [
      {
        objectApiName: 'call',
        criterias: [
          {
            field: 'owner',
            operator: 'in',
            value: TENANT_ID_COLLECT.LUOZHEN_TENEMENT.includes(tenantId)
              ? [userId]
              : TENANT_ID_COLLECT.JMKX_TENEMENT.includes(tenantId)
              ? allSubors
              : subordinateIdsandUserIdArrayString,
          },
          {
            field: 'start_time',
            operator: '>',
            value: [new Date().setHours(0, 0, 0, 0)],
          },
          {
            field: 'start_time',
            operator: '<',
            value: [new Date().setHours(24, 0, 0, 0)],
          },
          {
            field: 'record_type',
            operator: 'in',
            value: ['plan'],
          },
          {
            field: 'status',
            operator: 'in',
            value: ['1', '2'],
          },
        ],
        orderBy: 'start_time',
        order: 'desc',
        joiner: 'and',
      },
      {
        objectApiName: 'call',
        criterias: [
          {
            field: 'owner',
            operator: 'in',
            value: TENANT_ID_COLLECT.LUOZHEN_TENEMENT.includes(tenantId)
              ? [userId]
              : TENANT_ID_COLLECT.JMKX_TENEMENT.includes(tenantId)
              ? allSubors
              : subordinateIdsandUserIdArrayString,
          },
          {
            field: 'real_start_time',
            operator: '>',
            value: [new Date().setHours(0, 0, 0, 0)],
          },
          {
            field: 'real_start_time',
            operator: '<',
            value: [new Date().setHours(24, 0, 0, 0)],
          },
          {
            field: 'record_type',
            operator: 'in',
            value: ['report'],
          },
          {
            field: 'status',
            operator: 'in',
            value: ['1', '2'],
          },
        ],
        orderBy: 'real_start_time',
        order: 'desc',
        joiner: 'and',
      },
      {
        objectApiName: 'call',
        criterias: [
          {
            field: 'owner',
            operator: 'in',
            value: TENANT_ID_COLLECT.LUOZHEN_TENEMENT.includes(tenantId)
              ? [userId]
              : TENANT_ID_COLLECT.JMKX_TENEMENT.includes(tenantId)
              ? allSubors
              : subordinateIdsandUserIdArrayString,
          },
          {
            field: 'real_start_time',
            operator: '>',
            value: [new Date().setHours(0, 0, 0, 0)],
          },
          {
            field: 'real_start_time',
            operator: '<',
            value: [new Date().setHours(24, 0, 0, 0)],
          },
          {
            field: 'record_type',
            operator: 'in',
            value: ['coach'],
          },
          {
            field: 'status',
            operator: 'in',
            value: ['1', '2'],
          },
        ],
        orderBy: 'real_start_time',
        order: 'desc',
        joiner: 'and',
      },
    ];
    const jmkxExtBody = [
      {
        objectApiName: 'call_plan',
        criterias: [
          {
            field: 'owner',
            operator: 'in',
            value: subordinateIdsandUserIdArrayString,
          },
          {
            field: 'status',
            operator: 'in',
            value: ['待审批'],
          },
        ],
        orderBy: 'start_date',
        order: 'desc',
        joiner: 'and',
      },
      {
        objectApiName: 'time_off_territory',
        criterias: [
          {
            field: 'owner',
            operator: 'in',
            value: subordinateIdsandUserIdArrayString,
          },
          {
            field: 'status',
            operator: 'in',
            value: [1],
          },
        ],
        orderBy: 'start_date',
        order: 'desc',
        joiner: 'and',
      },
      {
        objectApiName: 'dcr',
        criterias: [
          {
            field: 'owner',
            operator: 'in',
            value: subordinateIdsandUserIdArrayString,
          },
          {
            field: 'mgr_status',
            value: ['0'],
            operator: 'in',
          },
        ],
        orderBy: 'create_time',
        order: 'desc',
        joiner: 'and',
      },
    ];
    if (TENANT_ID_COLLECT.JMKX_TENEMENT.includes(tenantId)) {
      payload.body[3].criterias.push({
        field: 'status',
        operator: 'in',
        value: ['计划中', '已完成'],
      });
      payload.body = _.concat(payload.body, jmkxExtBody);
    }
    if (TENANT_ID_COLLECT.LUOZHEN_TENEMENT.includes(tenantId)) {
      payload.body = _.concat(payload.body, luozhenExtBody);
    }

    actions.queryMultipleRecordList(payload, headerLogs);
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

  renderContent = () => {
    const {
      homeData,
      dataError,
      dataLoading,
      objectDescription,
      navigation,
      userInfo,
    } = this.props;
    const tenantId = userInfo.tenant_id;
    if (dataError) {
      return <ErrorScreen />;
    } else if (_.isEmpty(homeData) || dataLoading) {
      return <LoadingScreen />;
    }

    //* 第一次加载home页 提交性能日志
    if (_.isFunction(this.localLogCallback)) {
      this.localLogCallback({ layoutApiName: 'home', objectApiName: 'home' });
      this.localLogCallback = null;
    }

    return (
      <HomeList
        homeData={homeData}
        objectDescription={objectDescription}
        navigation={navigation}
        tenantId={tenantId}
      />
    );
  };

  componentWillUnmount() {
    this.props.actions.clearQuery();

    if (_.isFunction(_.get(this, 'eventListener.remove'))) {
      this.eventListener.remove();
    }
  }

  getEmailApiName = () => {
    const {
      tabs: { items },
      permission,
    } = this.props;
    const hasPermissionMenus = hasPermissionMenu(items, permission);
    return hasPermissionMenus.filter((item) => item.object_describe_api_name === 'alert')[0]
      ? hasPermissionMenus.filter((item) => item.object_describe_api_name === 'alert')[0].api_name
      : '';
  };

  render() {
    const { navigation } = this.props;

    return (
      <Container style={{ backgroundColor: themes.fill_base }}>
        <StyledHeader>
          <Left style={{ flex: 1 }}>
            <Button transparent onPress={() => navigation.navigate('DrawerOpen')}>
              <Icon name="menu" style={styles.icon} />
            </Button>
          </Left>
          <Body style={{ flex: 1, alignItems: 'center' }}>
            <Title style={{ color: themes.title_text_color }}>{I18n.t('tab.home')}</Title>
          </Body>
          <Right>
            <Button transparent onPress={() => navigation.navigate(this.getEmailApiName())}>
              <Icon name="ios-mail-outline" style={styles.icon} />
            </Button>
            {this.state.noReadCounts ? (
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 10,
                  backgroundColor: 'red',
                  position: 'absolute',
                  top: 10,
                  right: 5,
                }}
              />
            ) : null}
          </Right>
        </StyledHeader>
        {this.renderContent()}
      </Container>
    );
  }
}

const select = (state, screen) => {
  const query = getQueryInitialState({ state, screen });
  return {
    token: state.settings.token,
    userInfo: state.settings.userInfo,
    crmPowerSetting: state.settings.crmPowerSetting,
    objectDescription: state.settings.objectDescription,
    profile: state.settings.profile,
    permission: state.settings.permission,
    homeData: _.get(query.data, 'batch_result'),
    dataLoading: query.loading,
    dataError: query.error,
    cacheSetting: state.settings,
  };
};

const act = (dispatch, { navigation }) => {
  const key = _.get(navigation, 'state.key');
  return {
    actions: bindActionCreators(
      {
        queryMultipleRecordList: queryMultipleRecordList(key),
        clearQuery: clearQuery(key),
      },
      dispatch,
    ),
    dispatch,
  };
};

export default connect(select, act)(HomeScreen);

const styles = StyleSheet.create({
  icon: {
    color: themes.title_icon_color,
    fontSize: themes.font_header_size,
  },
});
