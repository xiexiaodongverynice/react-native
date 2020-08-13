/*
 @flow
 */
import React from 'react';
import { Platform, Text, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as _ from 'lodash';
import moment from 'moment';
import { Left, Right, Body, ListItem, Icon } from 'native-base';
import recordService from '../../../services/recordService';
import handleUpdateCascade, {
  CASCADE_DELETE,
  CASCADE_CREATE,
} from '../../../utils/helpers/handleUpdateCascade';
import IndexSwiperRecord from '../../../tabs/common/components/indexComponents/IndexSwiperRecord';
import themes from '../../../tabs/common/theme';
import { composeCustomerData, CALL_PATH } from './help';
import CallPlanService from '../../../services/callPlanService';
import CustomActionService from '../../../services/customActionService';
import { toastError, toastWaring } from '../../../utils/toast';
import { cascadeDeleteData } from '../../../actions/cascadeAction';
import I18n from '../../../i18n';

type Prop = {
  navigation: any,
  field_section: any,
  pageType: any,
  token: any,
  objectDescription: any,
  parentRecord: any,
  dispatch: void,
  date: any,
  index: any,
  items: any,
  handleRefreshView: void, //* 手动刷新父组件
  relatedLayoutComponent: any, //* related布局
  callPathRecordType: {
    profile: string,
    record_type: [
      {
        key: string,
        value: string,
      },
    ],
  },
};

type State = {
  thisDay: any,
};

export default class InnerView extends React.PureComponent<Prop, State> {
  state = {
    thisDay: '',
  };

  componentDidMount() {
    const { date, index } = this.props;
    const time = moment(date)
      .add(index, 'days')
      .format('YYYY-MM-DD');
    this.setState({
      thisDay: time,
    });
  }

  addEvent = (thisDay) => {
    const { items, navigation, field_section = {}, pageType } = this.props;
    if (pageType !== 'detail') {
      const extenderActions = field_section['extender_actions'];
      if (extenderActions && extenderActions.length > 0) {
        const params = this.props;
        const existData = items;
        navigation.navigate('TypeSelect', { thisDay, existData, ...params });
      }
    }
  };

  clickItem = (event) => {
    const { navigation, pageType, field_section } = this.props;

    //* 详情不能查看detai 拜访计划
    if (pageType == 'detail') {
      return false;
    }

    navigation.navigate('DetailModal', {
      navParam: {
        ...event,
        objectApiName: _.get(field_section, 'extender_display_object_api_name'),
        related_list_name: _.get(field_section, 'related_list_name'),
      },
    });
  };

  deleteCallPlan = (action, data) => {
    const { parentRecord, pageType, field_section, dispatch, handleRefreshView } = this.props;

    const parentId = _.get(parentRecord, 'id');
    const relatedListName = _.get(field_section, 'related_list_name');
    const objectApiName = _.get(field_section, 'extender_display_object_api_name');

    if (pageType === 'edit') {
      handleUpdateCascade({ data, relatedListName, status: CASCADE_DELETE, parentId, dispatch });
    } else if (pageType === 'detail') {
      const id = _.get(data, 'id');
      if (!id) return;
      handleUpdateCascade({ data, relatedListName, status: CASCADE_DELETE, parentId, dispatch });
      recordService.deleteRecord({ token: global.FC_CRM_TOKEN, id, objectApiName }).then((res) => {
        handleRefreshView();
      });
    } else if (pageType === 'add') {
      dispatch(cascadeDeleteData([data]));
    }
  };

  swipeAction = (action, data) => {
    const actionType = _.get(action, 'action');
    if (actionType === 'DELETE') {
      this.deleteCallPlan(action, data);
    }
  };

  renderEventsList = (events) => {
    const { thisDay } = this.state;
    const { pageType, items } = this.props;

    if (pageType == 'detail') {
      if (items.length > 0) {
        return <View>{this.renderEvents(items)}</View>;
      }
    } else {
      return (
        <View>
          {items.length > 0 && <View>{this.renderEvents(items)}</View>}
          <ListItem>
            <TouchableOpacity
              key="statrt_event"
              onPress={() => this.addEvent(thisDay)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
            >
              <Icon name="ios-add-circle-outline" style={{ color: '#4990EC' }} />
              <Text style={{ marginLeft: 5 }}>{I18n.t('InnerView.AddSchedule')}</Text>
            </TouchableOpacity>
          </ListItem>
          {this.renderExtenderCalendarActions()}
        </View>
      );
    }
  };

  renderExtenderCalendarActions = () => {
    const { thisDay } = this.state;
    const { field_section } = this.props;
    const extenderCalendarActions = _.get(field_section, 'extender_calendar_actions', []);
    if (!_.isEmpty(extenderCalendarActions)) {
      return _.map(extenderCalendarActions, (itemAction) => {
        const preApiName = _.get(itemAction, 'select_object');
        const preRecord_type = _.get(itemAction, 'select_object_record_type');
        const preCriterias = _.get(itemAction, 'target_filter_criterias.criterias', []);
        return (
          <ListItem>
            <TouchableOpacity
              key="extender_calendar_actions"
              onPress={() => this.addCallPath(thisDay, itemAction)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
            >
              <Icon name="ios-add-circle-outline" style={{ color: '#4990EC' }} />
              <Text style={{ marginLeft: 5 }}>{itemAction.label}</Text>
            </TouchableOpacity>
          </ListItem>
        );
      });
    }
  };

  addCallPath = (thisDay, itemAction) => {
    const { navigation, items } = this.props;
    const existData = items;
    const preApiName = _.get(itemAction, 'select_object');
    const preRecord_type = _.get(itemAction, 'select_object_record_type');
    const preCriterias = _.get(itemAction, 'target_filter_criterias.criterias', []);
    const preParams = {
      apiName: preApiName,
      callback: (data, navigation) =>
        this.handlerCallPathSelect(data, itemAction, thisDay, navigation),
      dataRecordType: preRecord_type,
      multipleSelect: true,
      targetRecordType: 'master',
      related: true,
      radio: true,
      preCriterias,
      // existData: [...new Set(_existDataSet)],
      existData,
      otherGoBack: true,
    };
    navigation.navigate('Relation', preParams);
  };

  handlerCallPathSelect = async (data, action, thisDay, navigation) => {
    // 点击确定后回调函数存储selectedData
    const callDate = moment(thisDay).valueOf();
    const { dispatch, parentRecord, field_section = {}, callPathRecordType } = this.props;

    const isCustom = _.get(action, 'is_custom', false);
    const relatedListName = _.get(field_section, 'related_list_name');

    const parentId = _.get(parentRecord, 'id');
    const fetchIds = [];
    _.map(data, (ite) => {
      fetchIds.push(ite.id);
    });

    const customerResult = await CallPlanService.getCallPlanPathCustomer(fetchIds);
    const custData = _.get(customerResult, 'result', []);
    const oldCustData = _.get(this.props, 'items', []);
    // custData
    // 1.源数据请求回来重复【custData】
    // 2.已经创建拜访计划的数据客户去重
    const customerIds = [];
    const filterCustData = [];
    _.map(custData, (item) => {
      if (!_.includes(customerIds, item.customer)) {
        customerIds.push(item.customer);
        filterCustData.push(item);
      }
    });
    const oldCustomerIds = _.map(oldCustData, (ite) => ite.customer);

    _.remove(filterCustData, (o) => _.includes(oldCustomerIds, o.customer));

    const triggerIds = _.map(filterCustData, (ite) => ite.customer);

    if (_.isEmpty(triggerIds)) {
      toastWaring('该拜访路线没有有效的拜访客户');
      return;
    }

    let resultCustomerDatas = [];
    if (isCustom) {
      resultCustomerDatas = await CallPlanService.checkCustomerDatas(triggerIds);
    } else {
      resultCustomerDatas = await CallPlanService.getCustomerDatas(triggerIds);
    }

    const resultData = composeCustomerData({
      data: resultCustomerDatas,
      action,
      callDate,
      field_section,
      callPathRecordType,
      type: CALL_PATH,
    });

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

  renderEvents = (items) => {
    const { pageType, parentRecord, field_section, relatedLayoutComponent } = this.props;
    const objectApiName = _.get(field_section, 'extender_display_object_api_name');
    const padlayout = _.get(relatedLayoutComponent, '[0].padlayout', {});
    const rowAction = _.get(relatedLayoutComponent, '[0].row_actions', []);

    return _.map(items, (event, index) => {
      const key = _.get(event, 'id') || _.get(event, '_id') || `event-${index}`;

      return (
        <View
          key={key}
          style={{
            borderBottomColor: '#c9c9c9',
            borderBottomWidth: themes.borderWidth,
            paddingVertical: 10,
            paddingLeft: 10,
          }}
        >
          <IndexSwiperRecord
            index={index}
            padlayout={padlayout}
            rowActions={rowAction}
            data={event}
            swipeAction={this.swipeAction}
            pageType={pageType}
            objectApiName={objectApiName}
            parentData={parentRecord}
            component={relatedLayoutComponent}
          />
        </View>
      );
    });
  };

  render() {
    const { thisDay } = this.state;
    const { items } = this.props;
    return (
      <View style={[styles.container, Platform.OS === 'ios' ? { height: 500 } : {}]}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 25,
            backgroundColor: themes.fill_subheader,
            paddingHorizontal: 10,
          }}
        >
          <Left>
            <Text>{`${items.length}个拜访`}</Text>
          </Left>
          <Body>
            <Text>{`${thisDay}`}</Text>
          </Body>
          <Right />
        </View>
        <ScrollView
          ref={(scrollView) => {
            if (scrollView && !this.isScroll) {
              scrollView.scrollTo({ x: 0, y: 0, animated: false }, 1);
              this.isScroll = true;
            }
          }}
          style={{
            marginBottom: 210,
          }}
        >
          {this.renderEventsList()}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'white',
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  capture: {
    flex: 0,
    fontSize: 70,
    color: '#fff',
    alignSelf: 'center',
    margin: 5,
  },
  timeLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lineStyle: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#ccc',
    width: '100%',
    marginTop: 8,
  },
  lineStyleDotted: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#eee',
    width: '100%',
    marginTop: 8,
  },
  text: {
    width: 60,
    paddingLeft: 10,
  },
  timeCardList: {
    height: 55,
    position: 'relative',
  },
  enventsListStyle: {
    position: 'relative',
    width: '100%',
  },
  contentContainer: {
    paddingLeft: 60,
    position: 'absolute',
    width: '100%',
  },
  innerTextStyle: {
    width: '100%',
    backgroundColor: '#DEE3F3',
    borderLeftWidth: 3,
    borderLeftColor: '#303A82',
    paddingLeft: 10,
    paddingTop: 4,
    paddingBottom: 4,
    fontSize: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    position: 'absolute',
  },
  timeStyle: {},
  timeStyleDotted: {
    color: '#ccc',
  },
});
