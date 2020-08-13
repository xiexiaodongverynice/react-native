/**
 * @flow
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ListItem, Left, Body, Icon } from 'native-base';
import _ from 'lodash';
import themes from '../../../tabs/common/theme';

type Props = {
  disabled: boolean,
  title: string,
  desc: string,
  navigation: any,
  pageType: string,
  handleCreate: void,
  onChange: void,
  field: any,
  data: any,
};

export default class AttachmentItem extends React.PureComponent<Props, State> {
  disable = false;

  gotoRelatedList() {
    if (this.disable) {
      return;
    }
    this.disable = true;

    setTimeout(() => {
      this.disable = false;
    }, 2000);

    const { pageType, title, desc, navigation, disabled } = this.props;
    const dataArr = _.get(this.props, 'data', []);

    const data = dataArr.filter((d) => d);

    const params = {
      title,
      data,
      desc,
      disabled,
      pageType,
      callback: this.handleAction,
    };

    navigation.navigate('AttachmentView', params);
  }

  handleAction = (updateList: Array) => {
    const { handleCreate, onChange = _.noop, field } = this.props;
    const fieldName = _.get(field, 'field');

    if (!_.isArray(updateList)) return;

    onChange(updateList);

    handleCreate &&
      handleCreate({
        apiName: fieldName,
        selected: [
          {
            value: updateList,
          },
        ],
        multipleSelect: false,
      });
  };

  renderDetail = () => {
    const { data = [], title = '附件' } = this.props;

    return (
      <View>
        <ListItem>
          <Left>
            <Text style={{ flex: 1 }}>{title}</Text>
          </Left>
          <Body>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => this.gotoRelatedList()}
              style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}
            >
              <Text style={{ flex: 1, textAlign: 'right', alignItems: 'center' }}>
                {data.length}个
              </Text>
              <Icon
                name="ios-arrow-forward"
                style={[styles.icon, { textAlign: 'right', paddingLeft: 5 }]}
              />
            </TouchableOpacity>
          </Body>
        </ListItem>
      </View>
    );
  };

  renderEdit = () => {
    const { data = [] } = this.props;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => this.gotoRelatedList()}
        style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}
      >
        <Text style={{ flex: 1, textAlign: 'right', alignItems: 'center' }}>{data.length}个</Text>
        <Icon
          name="ios-arrow-forward"
          style={[styles.icon, { textAlign: 'right', paddingLeft: 5 }]}
        />
      </TouchableOpacity>
    );
  };

  render() {
    const { pageType } = this.props;

    if (pageType === 'detail') {
      return this.renderDetail();
    } else {
      return this.renderEdit();
    }
  }
}

const styles = StyleSheet.create({
  icon: {
    color: themes.color_header_icon,
    fontSize: themes.font_header_size,
  },
});
