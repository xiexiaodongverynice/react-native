/**
 * @flow
 * * 搜索框组件
 */

import React, { Component } from 'react';
import { Text, View, Image, Platform } from 'react-native';
import Input from '../../lib/Input';
import I18n from '../../i18n';

type Props = {
  onChange: () => void,
};

type State = {
  textValue: string,
};

class SearchBar extends Component<Props, State> {
  defaultValue = '';

  state = {
    textValue: '',
  };

  setValue = (e) => {
    this.defaultValue = e.nativeEvent.text.trim();
  };

  clearValue = () => {
    const { onChange } = this.props;
    this.defaultValue = '';
    this.setState({ textValue: '' });
    onChange('');
  };

  searchPressed = () => {
    const { onChange } = this.props;
    this.setState({ textValue: this.defaultValue });
    onChange(this.defaultValue);
  };

  render() {
    const { textValue } = this.state;

    return (
      <View
        style={{
          height: 50,
          padding: 10,
          flexWrap: 'nowrap',
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 5,
          paddingBottom: 15,
          borderBottomWidth: 0.5,
          borderBottomColor: '#AFB8BB',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            height: 40,
            padding: 5,
            alignItems: 'center',
            backgroundColor: '#F4F4F4',
            borderRadius: 8,
            width: '88%',
          }}
        >
          <View
            style={{
              paddingTop: 10,
              paddingBottom: 10,
              paddingLeft: 8,
              paddingRight: 5,
              alignItems: 'center',
            }}
          >
            <Image
              style={{ height: 15, width: 15 }}
              source={require('../../tabs/img/search.png')}
            />
          </View>
          <Input
            placeholder={I18n.t('SearchBar.Enter')}
            returnKeyType="search"
            onSubmitEditing={this.searchPressed}
            placeholderTextColor="#999"
            onChange={this.setValue}
            defaultValue={textValue}
            style={{
              fontSize: 13,
              lineHeight: Platform.OS === 'android' ? 20 : 0,
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View style={{ width: 1, height: 20, backgroundColor: '#ccc', marginRight: 14 }} />
            <Text
              style={{
                color: '#666',
                fontSize: 13,
                marginRight: 9,
              }}
              onPress={this.searchPressed}
            >
              {I18n.t('SearchBar.Search')}
            </Text>
          </View>
        </View>
        <View>
          <Text
            style={{
              color: '#529FE0',
              fontSize: 15,
              marginLeft: 11,
            }}
            onPress={this.clearValue}
          >
            {I18n.t('SearchBar.Reset')}
          </Text>
        </View>
      </View>
    );
  }
}

export default SearchBar;
