/**
 * Create by Uncle Charlie, 4/1/2018
 * @flow
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import themes from './theme';
import CheckBox from '../common/components/CheckBox';
import I18n from '../../i18n';

type Prop = {
  marked: boolean,
  item: any,
  handleSelection: (any) => void,
  multipleSelect: boolean,
  isSubSelect: boolean,
};

export default class OptionItem extends React.PureComponent<Prop, {}> {
  handleSelection = (item, marked) => {
    const { handleSelection } = this.props;
    handleSelection(item);
  };

  render() {
    const { marked, item, multipleSelect, isSubSelect } = this.props;
    const value = item.label ? item.label : item.name;
    const key = item.value ? `${item.value}` : `${item.id}`;
    return (
      <View key={key} style={styles.item}>
        {multipleSelect ? (
          isSubSelect ? (
            <View flexDirection="row">
              <CheckBox
                handleCheck={() => this.handleSelection(item, marked)}
                checked={marked}
                style={{
                  flex: 3,
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  flexDirection: 'row',
                }}
                iconStyle={{
                  marginRight: 10,
                }}
              >
                <Text style={[styles.text, marked ? { color: themes.color_text_selected } : null]}>
                  {item.item.territory_name}-{value}
                </Text>
              </CheckBox>
              <View
                style={{
                  flex: 1,
                }}
              >
                <Text>{I18n.t('OptionItem.Subordinate')}</Text>
              </View>
            </View>
          ) : (
            <CheckBox
              handleCheck={() => this.handleSelection(item, marked)}
              checked={marked}
              style={{
                flex: 1,
                justifyContent: 'flex-start',
                alignItems: 'center',
                flexDirection: 'row',
              }}
              iconStyle={{
                marginRight: 10,
              }}
            >
              <Text style={[styles.text, marked ? styles.colorSelected : styles.colorNormal]}>
                {value}
              </Text>
            </CheckBox>
          )
        ) : (
          <TouchableOpacity
            onPress={() => this.handleSelection(item, marked)}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'stretch' }}
          >
            <Text style={[styles.text, marked ? styles.colorSelected : styles.colorNormal]}>
              {value}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  item: {
    paddingTop: 11,
    paddingBottom: 11,
    paddingLeft: 10,
    paddingRight: 10,

    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    borderBottomWidth: themes.regular_border_width,
    borderBottomColor: themes.border_color_base,
  },
  text: {
    flex: 1,
    textAlign: 'left',
    textAlignVertical: 'center',
    fontSize: 15,
    lineHeight: 21,
  },
  colorSelected: {
    color: '#0076FF',
  },
  colorNormal: {
    color: '#333333',
  },
});
