/**
 * Created by Uncle gao
 * @flow
 */

import React from 'react';
import { View, StyleSheet, DeviceEventEmitter } from 'react-native';
import { Title, Icon, Button } from 'native-base';
import { HeaderLeft, StyledBody, HeaderRight, StyledHeader } from '../common/components';
import themes from '../common/theme';
import TimeEventScreen from './TimeEventScreen';
import recordService from '../../services/recordService';
import ModalPopoverScreen from '../../tabs/common/ModalPopoverScreen';

type Props = {
  navigation: Object,
  dispatch: Function,
  screen: Object,
};
export default class DayTemplateScreen extends React.PureComponent<Props> {
  state = {
    dataList: [],
  };

  modalBtnRef: Button = null;
  modalRef: ModalPopoverScreen;
  data: any = undefined;
  recordType: any = undefined;
  token: any = undefined;

  async componentDidMount() {
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
        pageSize: 1000,
        pageNo: 1,
      },
    };
    const data = await recordService.queryRecordListService(payload);
    const dataList = data.result;
    this.setState({ dataList });
  }

  componentWillUnmount() {
    DeviceEventEmitter.emit('TemplateDetailBack');
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
    const { dataList } = this.state;
    const { navigation, dispatch, screen } = this.props;
    const addActions = [
      {
        actionCode: 'EDIT',
        actionLabel: '编辑',
        isDisabled: false,
        label: '编辑',
        target_layout_record_type: 'day',
        data: this.data,
        apiName: 'call_template',
        token: this.token,
      },
      {
        actionCode: 'DELETE',
        actionLabel: '删除',
        isDisabled: false,
        label: '删除',
        target_layout_record_type: 'day',
        data: this.data,
        apiName: 'call_template',
        token: this.token,
      },
    ];
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
              日拜访模板
            </Title>
          </StyledBody>
          <HeaderRight>
            <Button transparent onPress={() => this.setModalPopoverVisible(true)}>
              <Icon
                name="ios-more"
                style={{ color: 'white' }}
                ref={(el) => (this.modalBtnRef = el)}
              />
            </Button>
          </HeaderRight>
        </StyledHeader>
        <TimeEventScreen events={dataList} navigation={navigation} parentData={this.data} />
        <ModalPopoverScreen
          ref={(el) => (this.modalRef = el)}
          addActions={addActions}
          navigation={navigation}
        />
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
});
