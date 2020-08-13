/**
 * Created by Uncle Charlie, 2018/02/05
 * @flow
 */
import React from 'react';
import * as _ from 'lodash';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
import { Item } from 'native-base';
import Input from '../../lib/Input';
import I18n from '../../i18n';
import themes from '../../tabs/common/theme';

type Prop = {
  id: string,
  disabled: boolean,
  content: string,
  onChange: (val: string) => void,
  handleChangeText: (val: string) => void,
  validateFail: boolean,
  type: string,
  fieldRenderType: string,
  value: string | number,
};

const NUMBER_TYPE = ['real_number', 'big_int'];

export default class EditInput extends React.Component<Prop, {}> {
  componentDidMount() {
    const { value = '', handleChangeText } = this.props;
    if (_.isNumber(value) || value) {
      setTimeout(() => {
        handleChangeText(value);
      }, 0);
    }
  }

  handleChange = (val: string) => {
    const { handleChangeText, type = '' } = this.props;
    let value = val;
    if (NUMBER_TYPE.includes(type) && !_.isNaN(parseFloat(value))) {
      value = parseFloat(value);
    }
    if (handleChangeText) {
      handleChangeText(value);
    }
  };

  formValid = (val: string) => {
    const { onChange } = this.props;
    if (onChange) {
      onChange(val);
    }
  };

  componentWillReceiveProps(nextProps) {
    const { content: nextContent } = nextProps;
    const { content: prevContent } = this.props;

    if (_.toString(nextContent) !== _.toString(prevContent)) {
      this.formValid(_.toString(nextContent));
    }
  }

  renderContent = () => {
    const { disabled, validateFail = false, type = '', fieldRenderType } = this.props;
    const text = _.toString(_.get(this.props, 'content', ''));
    let platformProps = {};
    if (validateFail) {
      this.placeholderTextColor = themes.input_color_require;
    } else {
      this.placeholderTextColor = themes.input_placeholder;
    }

    //* 修正ios中文输入法错误和验证未更新
    // if (Platform.OS === 'ios') {
    //   platformProps = {
    //     onEndEditing: (evt) => {
    //       this.handleChange(evt.nativeEvent.text);
    //     },
    //     onChangeText: _.debounce((val) => {
    //       this.formValid(val);
    //     }, 50),
    //   };
    // } else {
    platformProps = {
      onChangeText: _.debounce((val) => {
        this.formValid(val);
        this.handleChange(val);
      }, 50),
    };
    // }
    return (
      <View style={{ height: 30, justifyContent: 'center' }}>
        {fieldRenderType === 'long_text' ? (
          <Input
            isTextarea
            placeholder={disabled ? '' : I18n.t('Input.Enter')}
            underlineColorAndroid="transparent"
            style={{
              padding: 0,
              textAlign: 'right',
              fontSize: themes.font_size_base,
              height: 65,
              justifyContent: 'center',
              alignItems: 'center',
              textAlignVertical: 'center',
              // lineHeight: 15,
              color: disabled ? themes.input_disable_color : themes.input_color,
            }}
            disabled={disabled}
            keyboardType={NUMBER_TYPE.includes(type) ? 'numeric' : 'default'}
            placeholderTextColor={this.placeholderTextColor}
            defaultValue={text}
            {...platformProps}
          />
        ) : (
          <Input
            underlineColorAndroid="transparent"
            style={{
              textAlign: 'right',
              fontSize: themes.font_size_base,
              paddingTop: 0,
              paddingBottom: 0,
              paddingVertical: 0,
              justifyContent: 'center',
              lineHeight: 15,
              color: disabled ? themes.input_disable_color : themes.input_color,
            }}
            disabled={disabled}
            placeholder={disabled ? '' : I18n.t('Input.Enter')}
            keyboardType={NUMBER_TYPE.includes(type) ? 'numeric' : 'default'}
            placeholderTextColor={this.placeholderTextColor}
            defaultValue={text}
            {...platformProps}
          />
        )}
      </View>
    );
  };

  render() {
    return this.renderContent();
  }
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    alignSelf: 'stretch',
    borderBottomColor: 'red',
    borderBottomWidth: themes.borderWidth,
  },
});
