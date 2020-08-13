/*eslint-disable*/
/**
 * Created by yjgao
 * @flow
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  DeviceEventEmitter,
} from 'react-native';
import { Header, Button, Title, Icon, Left, Right } from 'native-base';
import { HeaderLeft, StyledBody, HeaderRight, StyledHeader } from './components';
import themes from '../common/theme';
import _ from 'lodash';
import I18n from '../../i18n';
import moment from 'moment';
import recordService from '../../services/recordService';
import LayoutService from '../../services/layoutService';
import { processCriterias } from '../../utils/criteriaUtil';
import IndexDataParser from '../../services/dataParser';
import TemplateService from '../../services/templateService';

export default class SelectListScreen extends React.PureComponent {
  state = {
    items: [],
    listLayout: undefined,
    objectApiName: undefined,
    dataRecordType: undefined,
    layoutRecordType: undefined,
    currentObjectDesc: undefined,
    action: undefined,
  };

  async componentDidMount() {
    const { navigation } = this.props;
    const action = _.get(navigation, 'state.params.navParam.item');
    const record_type = _.get(navigation, 'state.params.navParam.record_type');
    const objectApiName = _.get(action, 'apiName');
    const token = _.get(action, 'token');
    const objectDescription = _.get(action, 'objectDescription');
    let recordType = record_type;
    if (objectApiName === 'call_template') {
      recordType = ['day', 'week'];
    }
    const listLayout = await LayoutService.getSepcificLayout({
      objectApiName,
      layoutType: 'index_page',
      recordType,
      token,
    });
    const criterias = processCriterias(
      _.get(listLayout, 'containers[0].components[0].views[0].criterias', []),
    );
    criterias.push({
      field: 'record_type',
      operator: 'in',
      value: [recordType],
    });

    const payload = {
      head: { token },
      body: {
        joiner: 'and',
        criterias,
        orderBy: 'create_time',
        order: 'desc',
        objectApiName,
        pageSize: 1000,
        pageNo: 1,
      },
    };

    const currentObjectDesc = IndexDataParser.getObjectDescByApiName(
      objectApiName,
      objectDescription,
    );

    const data = await recordService.queryRecordListService(payload);
    const { result } = data;

    this.setState({
      objectApiName,
      listLayout,
      items: result,
      dataRecordType: record_type,
      currentObjectDesc,
      action,
    });
  }

  componentWillReceiveProps(nextProps) {
    //console.log(nextProps);
  }

  isDayInThisWeek(day) {
    const today = moment().format('YYYY-MM-DD');
    const weekSelect = moment().weekday();
    const dayTimer = weekSelect * 3600000 * 24;
    const days = today + ' 00:00:00';
    const weekStart = moment(today).unix() * 1000 - dayTimer;
    const weekEnd = weekStart + 3600000 * 24 * 7 - 1;
    const theDay = moment(day).unix() * 1000;
    if (theDay < weekEnd) {
      return true;
    }
    return false;
  }

  isDayBeforToday(day) {
    const theDay = day + ' 23:59:59';
    const theDayTime = moment(day).unix() * 1000;
    const todayTime = moment().unix() * 1000;
    if (todayTime >= theDayTime) {
      return true;
    }
    return false;
  }

  itemClick(item) {
    const { action } = this.state;
    const date = _.get(action, 'data');
    // if type is day
    console.log(date, action);
    const start_date = date + ' 00:00:00';
    const end_date = date + ' 23:59:59';
    let start_time = moment(start_date).unix() * 1000;
    let end_time = moment(end_date).unix() * 1000;

    //if type is week
    const weekSelect = moment(date).weekday();
    const dayTimer = weekSelect * 3600000 * 24;
    const theDay = date + ' 00:00:00';
    const weekStart = moment(date).unix() * 1000 - dayTimer;
    const weekEnd = weekStart + 3600000 * 24 * 7 - 1;

    const title = '提示';
    if (action.actionCode === 'APPLY_TEMPLATE') {
      const message = '确定要应用此拜访模板吗？';
      Alert.alert(
        title,
        message,
        [
          {
            text: I18n.t('common_cancel'),
            onPress: () => {},
          },
          {
            text: I18n.t('common_sure'),
            onPress: () => {
              const date = _.get(action, 'data');
              if (item.record_type === 'week') {
                start_time = weekStart;
                end_time = weekEnd;
              }
              const id = item.id;
              const payload = {
                start_time,
                end_time,
              };
              const offsetTime = moment().utcOffset() * 60 * 1000;
              payload['zoneOffset'] = offsetTime;
              if (item.record_type === 'week' && this.isDayInThisWeek(date)) {
                const message = '拜访模板只能应用到未来的某一周';
                Alert.alert(
                  title,
                  message,
                  [
                    {
                      text: I18n.t('common_sure'),
                    },
                  ],
                  { cancelable: false },
                );
              } else if (item.record_type === 'day' && this.isDayBeforToday(date)) {
                const message = '拜访模板只能应用到未来的某一天';
                Alert.alert(
                  title,
                  message,
                  [
                    {
                      text: I18n.t('common_sure'),
                    },
                  ],
                  { cancelable: false },
                );
              } else {
                this.applyTemplate(id, payload);
              }
            },
          },
        ],
        { cancelable: false },
      );
    } else if (action.actionCode === 'COPY_TEMPLATE') {
      const message = '确定要复制到此拜访模板吗？';
      Alert.alert(
        title,
        message,
        [
          {
            text: I18n.t('common_cancel'),
            onPress: () => {},
          },
          {
            text: I18n.t('common_sure'),
            onPress: () => {
              const date = _.get(action, 'date');
              if (item.record_type === 'week') {
                start_time = weekStart;
                end_time = weekEnd;
              }
              const id = item.id;
              const payload = {
                start_time,
                end_time,
              };
              const offsetTime = moment().utcOffset() * 60 * 1000;
              payload['zoneOffset'] = offsetTime;
              this.copyTemplate(id, payload);
            },
          },
        ],
        { cancelable: false },
      );
    }
  }

  async applyTemplate(id, payload) {
    const { navigation } = this.props;
    const action = _.get(navigation, 'state.params.navParam.item');
    const token = _.get(action, 'token');
    const body = {
      head: { token },
      body: payload,
    };
    const data = await TemplateService.templateApply(id, body);
    if (data.head) {
      const title = '提示';
      const message = data.head.msg;
      Alert.alert(
        title,
        message,
        [
          {
            text: I18n.t('common_sure'),
            onPress: () => {
              DeviceEventEmitter.emit('BackCalenderPageEvent');
              navigation.goBack();
            },
          },
        ],
        { cancelable: false },
      );
    } else {
      const title = '提示';
      const message = '操作失败';
      Alert.alert(
        title,
        message,
        [
          {
            text: I18n.t('common_sure'),
            onPress: () => {
              //'BackCalenderPageEvent'
              DeviceEventEmitter.emit('BackCalenderPageEvent');
              navigation.goBack();
            },
          },
        ],
        { cancelable: false },
      );
    }
    navigation.goBack();
  }

  async copyTemplate(id, payload) {
    const { navigation } = this.props;
    const action = _.get(navigation, 'state.params.navParam.item');
    const token = _.get(action, 'token');
    const body = {
      head: { token },
      body: payload,
    };
    const data = await TemplateService.templateCopy(id, body);
    if (data.head) {
      const title = '提示';
      const message = data.head.msg;
      Alert.alert(
        title,
        message,
        [
          {
            text: I18n.t('common_sure'),
            onPress: () => {
              navigation.goBack();
            },
          },
        ],
        { cancelable: false },
      );
    } else {
      const title = '提示';
      const message = '操作失败';
      Alert.alert(
        title,
        message,
        [
          {
            text: I18n.t('common_sure'),
            onPress: () => {
              navigation.goBack();
            },
          },
        ],
        { cancelable: false },
      );
    }
    navigation.goBack();
  }

  renderListItem() {
    const { items } = this.state;
    const cardList = [];
    _.each(items, (item) => {
      cardList.push(
        <TouchableOpacity key={item.id} onPress={this.itemClick.bind(this, item)}>
          <View>{this.renderItemStyle(item)}</View>
        </TouchableOpacity>,
      );
    });
    return cardList;
  }

  getFieldDes(field) {
    const { currentObjectDesc, listLayout, action } = this.state;
    const descFields = currentObjectDesc.fields;
    let label = field;
    descFields.forEach((des) => {
      if (des.api_name == 'record_type') {
        des['options'].forEach((option) => {
          if (option.value === field) {
            label = option.label;
          }
        });
      }
    });
    return label;
  }

  renderItemStyle(item) {
    return (
      <View style={styles.itemStyle}>
        <View style={styles.itemLeft}>
          <View style={{ flexDirection: 'row' }}>
            <Text style={{ fontSize: 18, alignItems: 'center' }}>{item.name}</Text>
            <Text style={{ fontSize: 15, paddingLeft: 10, alignItems: 'center' }}>
              {this.getFieldDes(item.record_type)}
            </Text>
          </View>
          <View style={{ paddingTop: 5 }}>
            <Text style={{ fontSize: 15, color: 'gray', alignItems: 'center' }}>
              拜访总数：{item.amount}
            </Text>
          </View>
        </View>
        <View style={styles.itemRight}>
          <Button transparent>
            <Icon name="ios-arrow-forward" style={{ color: 'gray' }} />
          </Button>
        </View>
      </View>
    );
  }

  render() {
    const { navigation, dispatch, screen } = this.props;
    const { items } = this.state;
    return (
      <View style={styles.container}>
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
              选择拜访模板
            </Title>
          </StyledBody>
          <HeaderRight />
        </StyledHeader>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 30,
            backgroundColor: themes.fill_subheader,
            paddingHorizontal: 10,
          }}
        >
          <Left>
            <Text>{`${items.length}条`}</Text>
          </Left>
          <Right />
        </View>
        <ScrollView>{this.renderListItem()}</ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#F5F5F9',
    height: 800,
  },
  itemStyle: {
    flex: 1,
    flexDirection: 'row',
    height: 80,
    backgroundColor: 'white',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingLeft: 10,
  },
  itemLeft: {
    flexDirection: 'column',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
