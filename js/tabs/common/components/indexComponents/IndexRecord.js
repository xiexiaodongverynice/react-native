/**
 * @flow
 * * 用于列表item展示
 */

import React from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';

import { TouchableOpacity, View, Text } from 'react-native';
import { Icon, ListItem } from 'native-base';
import IndexDataParser from '../../../../services/dataParser';
import themes from '../../theme';
import * as Util from '../../../../utils/util';

type Props = {
  objectDescription: any,
  objectApiName: string,
  padlayout: any,
  data: any,
  index: number,
  component: any,
};

/**
 *
 *
 * @class IndexRecord
 * @extends {React.PureComponent<Props, State>}
 * * * 用于relation列表数据展示
 */
class IndexRecord extends React.PureComponent<Props, State> {
  labelBadge = (label, color) => {
    if (!label) return null;
    return (
      <View
        style={{
          width: 48,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: color,
          paddingVertical: 5,
          borderRadius: 2,
        }}
      >
        {label && label.indexOf('-') > 0
          ? _.map(label.split('-'), this.renderLabel)
          : this.renderLabel(label)}
      </View>
    );
  };

  renderLabel = (label, index) => (
    <View key={label + index}>
      <Text
        style={
          _.isUndefined(index)
            ? {
                color: '#fff',
                fontSize: 11,
              }
            : {
                color: '#fff',
                fontSize: 10,
              }
        }
      >
        {label}
      </Text>
    </View>
  );

  getLabels = (item, rightLabels) => {
    const { objectDescription, objectApiName, component } = this.props;
    const labelValue = _.get(rightLabels, 'value');

    // const fields = _.get(component, '[0].field_sections[0].fields', []);
    const fields = _.get(component, 'fields', []);
    let colorField;
    let fieldColor;

    if (fields.length > 0) {
      fields.forEach((field) => {
        if (field.field === labelValue) {
          colorField = field;
        }
      });
    }

    if (colorField) {
      const type = _.get(item, `[${labelValue}]`);
      fieldColor = _.get(colorField, `tag_color[${type}]`);
    }

    const color = fieldColor || _.get(rightLabels, 'color');
    const label = IndexDataParser.parseListLabels(
      labelValue,
      _.get(item, labelValue),
      objectDescription,
      objectApiName,
    );

    return this.labelBadge(label, color);
  };

  getTitle = (item) => {
    const { objectDescription, objectApiName, padlayout } = this.props;
    if (!_.isEmpty(padlayout)) {
      const { needLabels } = padlayout;
      if (_.get(padlayout, 'title', '')) {
        const title = IndexDataParser.parseListValue(
          padlayout.title,
          item,
          objectDescription,
          objectApiName,
          needLabels,
        );
        return (
          <View style={{ flex: 1, marginRight: 5 }}>
            <Text
              style={{
                fontWeight: 'bold',

                color: themes.list_title_color,
                fontSize: themes.list_title_size,
                flexWrap: 'wrap',
              }}
            >
              {title || ''}
            </Text>
          </View>
        );
      }
    } else {
      return null;
    }
  };

  getSubTitle = (item) => {
    const { objectDescription, objectApiName, padlayout } = this.props;
    if (_.get(padlayout, 'sub_title')) {
      const { needLabels } = padlayout;
      const subtitleVal = IndexDataParser.parseListValue(
        padlayout.sub_title,
        item,
        objectDescription,
        objectApiName,
        needLabels,
      );

      return (
        <View
          style={{
            marginHorizontal: 25,
          }}
        >
          <Text
            style={{
              color: themes.list_title_color,
              fontSize: themes.list_subtitle_size,
            }}
          >
            {Util.cutString(subtitleVal || '')}
          </Text>
        </View>
      );
    }
    return null;
  };

  getContents = (item) => {
    const { padlayout, objectDescription, objectApiName } = this.props;
    if (!_.isEmpty(padlayout)) {
      const { needLabels } = padlayout;
      return (
        <View style={{ marginTop: 5 }}>
          {padlayout.contents &&
            padlayout.contents.map((content, index) => {
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
                    color: themes.list_subtitle_color,
                  }}
                >
                  {parsedValue}
                </Text>
              );
            })}
        </View>
      );
    } else {
      return null;
    }
  };

  render() {
    const { data, index, component, padlayout } = this.props;
    const rightLabels = _.get(padlayout, 'labels[0]', false);
    return (
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: '#fff',
          paddingHorizontal: 10,
          paddingVertical: 10,
        }}
      >
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
            {this.getTitle(data)}
            {this.getSubTitle(data)}
          </View>
          <View style={{ justifyContent: 'flex-start' }}>{this.getContents(data)}</View>
        </View>
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-start',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            {rightLabels && this.getLabels(data, rightLabels)}
          </View>
        </View>
      </View>
    );
  }
}

const select = (state) => ({
  objectDescription: state.settings.objectDescription,
});

export default connect(select)(IndexRecord);
