/*eslint-disable */
/**
 * Created by Uncle gao
 * @flow
 */

import React from 'react';
import { StyleSheet, DeviceEventEmitter } from 'react-native';
import { Header, Title, Icon, Container, Tab, Tabs, Left, Right, Body, Button } from 'native-base';
import themes from '../common/theme';
import recordService from '../../services/recordService';
import TimeEventScreen from './TimeEventScreen';
import { StyledHeader } from '../common/components';
import ModalPopoverScreen from '../../tabs/common/ModalPopoverScreen';

export default class WeekTemplateScreen extends React.PureComponent {
  state = {
    weekList: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
  };

  modalBtnRef: Button = null;
  modalRef: ModalPopoverScreen;
  data: any = undefined;
  recordType: any = undefined;
  token: any = undefined;

  componentDidMount() {
    this.renderData();
  }

  componentWillReceiveProps(nextProps) {
    this.renderData();
  }

  componentWillUnmount() {
    DeviceEventEmitter.emit('TemplateDetailBack');
  }

  async renderData() {
    const params = _.get(this.props, 'navigation.state.params.navParam');
    const { objectApiName, recordType, record, token } = params;
    this.data = record;
    this.recordType = recordType;
    this.token = token;
    const payload = {
      head: { token },
      body: {
        joiner: 'and',
        criterias: [
          {
            field: 'parent_id',
            operator: '==',
            value: [record.id],
          },
        ],
        orderBy: 'create_time',
        order: 'desc',
        objectApiName: objectApiName + '_detail',
        pageSize: 10000,
        pageNo: 1,
      },
    };
    const data = await recordService.queryRecordListService(payload);
    const dataList = data.result;
    this.generateWeekList(dataList);
  }

  generateWeekList(dataList) {
    const weekList = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    };
    _.each(dataList, (item) => {
      if (item.day == '0') {
        weekList.sunday.push(item);
      } else if (item.day == '1') {
        weekList.monday.push(item);
      } else if (item.day == '2') {
        weekList.tuesday.push(item);
      } else if (item.day == '3') {
        weekList.wednesday.push(item);
      } else if (item.day == '4') {
        weekList.thursday.push(item);
      } else if (item.day == '5') {
        weekList.friday.push(item);
      } else if (item.day == '6') {
        weekList.saturday.push(item);
      }
    });
    this.setState({ weekList });
  }

  setModalPopoverVisible = (visible: boolean, callback: Function = () => void 0) => {
    const modalBtnRef = this.modalBtnRef;
    modalBtnRef.wrappedInstance.wrappedInstance.root.measure(
      (x, y, width, height, pageX, pageY) => {
        this.modalRef.setAnchorPosition(
          {
            pageX: pageX + width / 2,
            pageY: pageY + height / 2,
          },
          () => {
            this.modalRef.setModalVisible(visible, callback);
          },
        );
      },
    );
  };

  render() {
    const { navigation, dispatch, screen } = this.props;
    const { weekList } = this.state;
    const addActions = [
      {
        actionCode: 'EDIT',
        actionLabel: '编辑',
        isDisabled: false,
        label: '编辑',
        target_layout_record_type: 'week',
        data: this.data,
        apiName: 'call_template',
        token: this.token,
      },
      {
        actionCode: 'DELETE',
        actionLabel: '删除',
        isDisabled: false,
        label: '删除',
        target_layout_record_type: 'week',
        data: this.data,
        apiName: 'call_template',
        token: this.token,
      },
    ];
    return (
      <Container style={styles.container}>
        <StyledHeader hasTabs style={{ backgroundColor: themes.title_background }}>
          <Left>
            <Button transparent onPress={() => this.props.navigation.goBack()}>
              <Icon name="arrow-back" style={{ color: 'white' }} />
            </Button>
          </Left>
          <Body>
            <Title style={{ color: 'white' }}>周拜访模板</Title>
          </Body>
          <Right>
            <Button transparent onPress={() => this.setModalPopoverVisible(true)}>
              <Icon
                name="ios-more"
                style={{ color: 'white' }}
                ref={(el) => (this.modalBtnRef = el)}
              />
            </Button>
          </Right>
        </StyledHeader>

        <Tabs initialPage={0}>
          <Tab heading="周一">
            <TimeEventScreen
              events={weekList.monday}
              navigation={navigation}
              parentData={this.data}
              weekDay="1"
            />
          </Tab>
          <Tab heading="周二">
            <TimeEventScreen
              events={weekList.tuesday}
              navigation={navigation}
              parentData={this.data}
              weekDay="2"
            />
          </Tab>
          <Tab heading="周三">
            <TimeEventScreen
              events={weekList.wednesday}
              navigation={navigation}
              parentData={this.data}
              weekDay="3"
            />
          </Tab>
          <Tab heading="周四">
            <TimeEventScreen
              events={weekList.thursday}
              navigation={navigation}
              parentData={this.data}
              weekDay="4"
            />
          </Tab>
          <Tab heading="周五">
            <TimeEventScreen
              events={weekList.friday}
              navigation={navigation}
              parentData={this.data}
              weekDay="5"
            />
          </Tab>
          <Tab heading="周六">
            <TimeEventScreen
              events={weekList.saturday}
              navigation={navigation}
              parentData={this.data}
              weekDay="6"
            />
          </Tab>
          <Tab heading="周日">
            <TimeEventScreen
              events={weekList.sunday}
              navigation={navigation}
              parentData={this.data}
              weekDay="0"
            />
          </Tab>
        </Tabs>
        <ModalPopoverScreen
          ref={(el) => (this.modalRef = el)}
          addActions={addActions}
          navigation={navigation}
        />
      </Container>
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
});
