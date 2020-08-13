/**
 * @flow
 * *用于列表滑动组件
 */

import React from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import { View, Text, TouchableOpacity } from 'react-native';
import Swipeout from 'react-native-swipeout';
import Privilege from 'fc-common-lib/privilege';
import IndexRecord from './IndexRecord';
import { checkShowWhen } from '../../helpers/recordHelper';
import * as Util from '../../../../utils/util';
import I18n from '../../../../i18n';
import { Confirm } from '../../components';

type Props = {
  rowActions: any,
  data: any,
  index: number,
  padlayout: any,
  pageType: string,
  data: any,
  objectApiName: string,
  parentData: any,
  permission: any,
  swipeAction: void,
  onPress: void,
  component: any,
};

class IndexSwiperRecord extends React.PureComponent<Props, {}> {
  checkShow = (item) => {
    const { parentData = {}, data = {}, pageType } = this.props;
    const show_expression = Util.executeDetailExp(
      _.get(item, 'show_expression', 'return true'),
      data,
      parentData,
      {},
    );

    const show_when = checkShowWhen(item, pageType);

    const hide_expression = Util.executeDetailExp(
      _.get(item, 'hide_expression', 'return false'),
      data,
      parentData,
      {},
    );
    return show_expression && show_when && !hide_expression;
  };

  checkPrevilage = (action) => {
    const { permission, objectApiName } = this.props;
    const actionRefObjectApiName = _.get(action, 'ref_obj_describe', objectApiName);
    const actionCode = _.get(action, 'action');
    return Privilege.checkAction(actionCode, permission, actionRefObjectApiName);
  };

  //* 判断是否为 confirm
  confirmAction = (action) => {
    const needConfirm = _.get(action, 'need_confirm', false);
    const { data, swipeAction } = this.props;
    const actionType = _.toUpper(_.get(action, 'action'));
    const tarRecordType = _.get(action, 'target_layout_record_type');

    if (needConfirm) {
      const title = _.get(action, 'confirm_message', '确定?');
      return () => {
        Confirm({
          title,
          onOK: () => {
            swipeAction(action, data);
          },
          onCancel: () => {
            console.log('Cancel');
          },
        });
      };
    } else {
      return () => {
        swipeAction(action, data);
      };
    }
  };

  getSwipeButtons = (rowActions) => {
    const { parentData = {}, data = {} } = this.props;
    const buttons = [];

    _.each(rowActions, (action) => {
      const checkShowStatus = this.checkShow(action);
      const checkPrevilageStatus = this.checkPrevilage(action);
      if (!checkShowStatus || !checkPrevilageStatus) return;

      const BtnColor = _.get(action, 'action') === 'DELETE' ? 'red' : '#3682D5';

      buttons.push({
        key: `${action.action}_${action.label}`,
        text: action.label ? action.label : I18n.t(_.toLower(action.action)),
        onPress: this.confirmAction(action),
        backgroundColor: BtnColor,
      });
    });

    return buttons;
  };

  renderSwiperReCord = (rightSwipe = [], leftSwipe = []) => {
    const { data, index, padlayout, objectApiName, onPress = () => {}, component } = this.props;
    const rightSwipeButtons = this.getSwipeButtons(rightSwipe);
    const leftSwipeButtons = this.getSwipeButtons(leftSwipe);

    return (
      <Swipeout
        right={rightSwipeButtons}
        left={leftSwipeButtons}
        autoClose
        // close={this.state.rowId !== item.id}
        buttonWidth={100}
        backgroundColor="#fff"
        // rowIndex={item.id}
        // onOpen={_.debounce(() => {
        //   this.setState({ rowId: item.id });
        // }, 200)}
        // onClose={_.debounce(() => {
        //   if (item.id === this.state.rowId) {
        //     this.setState({ rowId: null });
        //   }
        // }, 200)}
        style={{
          flex: 1,
          alignSelf: 'stretch',
        }}
      >
        <TouchableOpacity onPress={onPress}>
          <IndexRecord
            index={index}
            padlayout={padlayout}
            data={data}
            objectApiName={objectApiName}
            component={component}
          />
        </TouchableOpacity>
      </Swipeout>
    );
  };

  render() {
    const { onPress, rowActions, objectApiName, index, padlayout, data, component } = this.props;
    const swipeList = _.filter(rowActions, (row) => row.mobile_show);
    const rightSwipe = _.filter(swipeList, { mobile_show: 'SWIPE_RIGHT' });
    const leftSwipe = _.filter(swipeList, { mobile_show: 'SWIPE_LEFT' });
    if (_.isEmpty(swipeList)) {
      return (
        <TouchableOpacity onPress={onPress}>
          <IndexRecord
            index={index}
            padlayout={padlayout}
            data={data}
            objectApiName={objectApiName}
            component={component}
          />
        </TouchableOpacity>
      );
    } else {
      return this.renderSwiperReCord(rightSwipe, leftSwipe);
    }
  }
}

const select = (state) => ({
  permission: state.settings.permission,
});

export default connect(select)(IndexSwiperRecord);
