/**
 * Create by Uncle Charlie, 5/1/2018
 * @flow
 */

import React from 'react';
import _ from 'lodash';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import themes from './theme';
import * as Util from '../../utils/util';
import IndexDataParser from '../../services/dataParser';
import CheckBox from '../common/components/CheckBox';
import { toastWaring } from '../../utils/toast';

type Prop = {
  handleSelection: (any) => void,
  item: any,
  marked: boolean,
  phoneLayout: any,
  objectDescription: any,
  objectApiName: any,
  related: boolean,
  repetition: boolean, //* 是否重复数据
};

export default class RelationItem extends React.Component<Prop, {}> {
  _handlePress = (item) => {
    const { handleSelection } = this.props;
    handleSelection(item);
  };

  getSubTitle = (item, marked) => {
    const { objectDescription, objectApiName, phoneLayout } = this.props;
    if (phoneLayout.sub_title) {
      const { needLabels } = phoneLayout;
      const subtitleVal = IndexDataParser.parseListValue(
        phoneLayout.sub_title,
        item,
        objectDescription,
        objectApiName,
        needLabels,
      );
      return (
        <View
          style={{
            // backgroundColor: 'yellow',
            marginHorizontal: 25,
            // marginVertical: 5,
          }}
        >
          <Text
            style={{
              color: marked ? '#0076ff' : themes.list_title_color,
              fontSize: themes.list_title_size,
            }}
          >
            {Util.cutString(subtitleVal || '')}
          </Text>
        </View>
      );
    }
    return null;
  };

  getTitle = (item, marked) => {
    const { objectDescription, objectApiName, phoneLayout } = this.props;
    if (_.get(phoneLayout, 'title', '')) {
      const { needLabels } = phoneLayout;
      const title = IndexDataParser.parseListValue(
        phoneLayout.title,
        item,
        objectDescription,
        objectApiName,
        needLabels,
      );

      return (
        <View>
          <Text
            style={{
              fontWeight: 'bold',
              color: marked ? '#0076ff' : themes.list_title_color,
              fontSize: themes.list_title_size,
              flexWrap: 'wrap',
            }}
          >
            {title || ''}
          </Text>
        </View>
      );
    }
    return null;
  };

  getContents = (item, marked) => {
    const { phoneLayout, objectDescription, objectApiName } = this.props;
    const { needLabels } = phoneLayout;
    return (
      <View style={{ marginTop: 5 }}>
        {phoneLayout.contents.map((content, index) => {
          const parsedValue = IndexDataParser.parseListValue(
            content,
            item,
            objectDescription,
            objectApiName,
            needLabels,
          );

          return (
            <Text
              key={`row_content_${item.id}_${Math.random()}`}
              style={{
                marginTop: 5,
                fontSize: themes.list_subtitle_size,
                color: marked ? '#0076ff' : themes.list_subtitle_color,
              }}
            >
              {Array.isArray(parsedValue) ? parsedValue.join(', ') : parsedValue}
            </Text>
          );
        })}
      </View>
    );
  };

  renderRow = () => {
    const { item, marked, phoneLayout } = this.props;
    return (
      <View
        style={{
          flex: 4,
          flexDirection: 'column',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {this.getTitle(item, marked)}
          {_.get(phoneLayout, 'sub_title') && this.getSubTitle(item, marked)}
        </View>
        <View style={{ justifyContent: 'flex-start' }}>
          {_.get(phoneLayout, 'contents') && this.getContents(item, marked)}
        </View>
      </View>
    );
  };

  render() {
    const { item, marked, related, repetition } = this.props;
    return (
      <View key={`${_.get(item, 'name', 'relation_item')}`} style={[styles.item]}>
        {related ? (
          <CheckBox
            handleCheck={() => {
              if (repetition) {
                toastWaring('请勿重复选择');
              } else {
                this._handlePress(item);
              }
            }}
            checked={marked}
            repetition={repetition}
            style={{
              flex: 1,
              alignSelf: 'stretch',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
            }}
            iconStyle={{
              marginRight: 10,
            }}
          >
            {this.renderRow()}
          </CheckBox>
        ) : (
          <TouchableOpacity
            style={{
              flex: 1,
              alignSelf: 'stretch',
              justifyContent: 'center',
              alignItems: 'flex-start',
            }}
            onPress={() => {
              if (repetition) {
                toastWaring('请勿重复选择');
              } else {
                this._handlePress(item);
              }
            }}
          >
            {this.renderRow()}
          </TouchableOpacity>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: themes.regular_border_width,
    borderBottomColor: themes.border_color_base,
  },
  text: {
    textAlign: 'left',
    textAlignVertical: 'center',
  },
});
