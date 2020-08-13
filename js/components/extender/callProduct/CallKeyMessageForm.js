/**
 * @flow
 */

import React from 'react';
import { View } from 'react-native';
import _ from 'lodash';
import { ListItem, Text, Button, ActionSheet } from 'native-base';
import I18n from '../../../i18n';
import CheckBox from '../../../tabs/common/components/CheckBox';
import { intlValue } from '../../../utils/crmIntlUtil';
import preventDuplicate from '../../../tabs/common/helpers/preventDuplicate';
import { CALL_MESSAGE_KEY } from './const';
import { crmTenant_isjmkx } from '../../../utils/const';
import handleUpdateCascade, {
  CASCADE_CREATE,
  CASCADE_DELETE,
  CASCADE_UPDATE,
} from '../../../utils/helpers/handleUpdateCascade';

type Prop = {
  keyMessageReaction: any,
  existMessageList: Array<any>,
  defaultMessageList: Array<any>,
  dispatch: void,
  parentCallId: any,
  pageType: ?string,
};

class CallKeyMessageForm extends React.PureComponent<Prop, State> {
  selectOpinion = (selectedMessage) => {
    const { keyMessageReaction, dispatch, parentCallId } = this.props;
    const buttons = _.map(keyMessageReaction, (x) => x.label);
    const optionValue = crmTenant_isjmkx()
      ? buttons
      : [].concat(buttons, [intlValue('action.cancel')]);

    const actionOptions = crmTenant_isjmkx()
      ? {
          options: optionValue,

          title: I18n.t('select_action'),
        }
      : {
          options: optionValue,
          cancelButtonIndex: optionValue.length - 1,
          destructiveButtonIndex: optionValue.length - 1,
          title: I18n.t('select_action'),
        };

    ActionSheet.show(actionOptions, (buttonIndex) => {
      if (buttonIndex >= keyMessageReaction.length) {
        return;
      }

      const selectedValue = _.find(keyMessageReaction, {
        label: `${optionValue[buttonIndex]}`,
      });

      const _id = _.get(selectedMessage, '_id');
      const params = {
        id: _.get(selectedMessage, 'id'),
        key_message: _.get(selectedMessage, 'key_message'),
        product: _.get(selectedMessage, 'product'),
        reaction: _.get(selectedValue, 'value', ''),
      };

      if (!_id) {
        // * 修改数据库数据需要提供当前version
        _.set(params, 'version', _.get(selectedMessage, 'version'));
      } else {
        _.set(params, '_id', _id);
      }

      handleUpdateCascade({
        data: params,
        relatedListName: CALL_MESSAGE_KEY,
        status: CASCADE_UPDATE,
        parentId: parentCallId,
        dispatch,
      });
    });
  };

  handleCheckMessage = (checked, item) => {
    const { dispatch, parentCallId } = this.props;

    if (!checked) {
      const params = {
        key_message: _.get(item, 'id'),
        product: _.get(item, 'product'),
      };
      handleUpdateCascade({
        data: params,
        relatedListName: CALL_MESSAGE_KEY,
        status: CASCADE_CREATE,
        parentId: parentCallId,
        dispatch,
      });
    } else {
      const params = {};
      const _id = _.get(item, '_id');
      if (_id) {
        _.set(params, '_id', _id);
      } else {
        params.id = _.get(item, 'id');
      }

      handleUpdateCascade({
        data: params,
        relatedListName: CALL_MESSAGE_KEY,
        status: CASCADE_DELETE,
        parentId: parentCallId,
        dispatch,
      });
    }
  };

  renderRight = (checked, selectedMessage) => {
    const { pageType, keyMessageReaction } = this.props;
    const selectedReactionText = _.get(selectedMessage, 'reaction');
    const selectedValue = _.find(keyMessageReaction, {
      value: selectedReactionText,
    });
    if (pageType === 'detail') {
      return (
        <Text
          style={{
            textAlign: 'right',
            fontSize: 13,
            fontFamily: 'PingFangSC-Regular',
            color: '#666666',
          }}
        >
          {_.get(selectedValue, 'label', '')}
        </Text>
      );
    } else {
      return (
        checked && (
          <Button
            transparent
            onPress={preventDuplicate(() => {
              this.selectOpinion(selectedMessage);
            }, 1000)}
          >
            <Text style={{ textAlign: 'right' }}>{_.get(selectedValue, 'label', '选择反馈')}</Text>
          </Button>
        )
      );
    }
  };

  renderView = (checked, label, selectedMessage, item) => {
    const { pageType } = this.props;
    if (pageType !== 'detail') {
      return (
        <ListItem
          onPress={this.handleItemClick}
          key={`${_.get(item, 'id')}_key_message${Math.random()}`}
          style={{ borderBottomWidth: 0, paddingBottom: 0 }}
        >
          <CheckBox
            key={_.get(item, 'id')}
            checked={checked}
            style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}
            handleCheck={() => {
              if (pageType === 'detail') return;
              const itemData = checked ? selectedMessage : item;
              this.handleCheckMessage(checked, itemData);
            }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  width: '70%',
                  marginLeft: 20,
                }}
              >
                {label}
              </Text>
              {this.renderRight(checked, selectedMessage)}
            </View>
          </CheckBox>
        </ListItem>
      );
    } else {
      return (
        <ListItem
          onPress={this.handleItemClick}
          key={`${_.get(item, 'id')}_key_message${Math.random()}`}
          style={{ borderBottomWidth: 0, paddingBottom: 0 }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                width: '70%',
                fontSize: 13,
                fontFamily: 'PingFangSC-Regular',
                color: '#666666',
              }}
            >
              {label}
            </Text>
            {this.renderRight(checked, selectedMessage)}
          </View>
        </ListItem>
      );
    }
  };

  renderItem = (item) => {
    const { existMessageList, pageType, defaultMessageList } = this.props;

    const key_message = pageType === 'detail' ? _.get(item, 'key_message') : _.get(item, 'id');

    const selectedMessage = _.find(existMessageList, (e) => _.get(e, 'key_message') == key_message);
    const checked = !_.isEmpty(selectedMessage);

    //* 用于label显示
    const defaultMessage = _.find(
      defaultMessageList,
      (e) => _.get(e, 'key_message') == key_message || _.get(e, 'id') == key_message,
    );

    const label =
      _.get(item, 'label', null) ||
      _.get(item, 'name') ||
      _.get(item, 'key_message__r.name') ||
      _.get(defaultMessage, 'name');

    return this.renderView(checked, label, selectedMessage, item);
  };

  render() {
    const { pageType, defaultMessageList, existMessageList } = this.props;
    const keyMessageeMap = pageType === 'detail' ? existMessageList : defaultMessageList;

    return <View>{_.map(keyMessageeMap, (message) => this.renderItem(message))}</View>;
  }
}

export default CallKeyMessageForm;
