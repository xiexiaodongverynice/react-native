/**
 * @flow
 */
import React from 'react';
import * as _ from 'lodash';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import { Item } from 'native-base';
import { BigNumber } from 'bignumber.js';
import Input from '../../../lib/Input';
import themes from '../../../tabs/common/theme';
import { toastWaring } from '../../../utils/toast';
import I18n from '../../../i18n';

type Prop = {
  // id: string,
  disabled: boolean,
  // value: number,
  fieldDesc: any,
  onChange: (val: string) => void,
  handleChangeText: (val: string) => void,
  validateFail: boolean,
  // type: string,
  title: string,
  content: string | number,
};

type State = {
  content: string,
  paddingTop: number, //* 用于设置百分比符号和number的高度
};

export default class EditPercentage extends React.Component<Prop, State> {
  state = {
    paddingTop: 5,
  };

  handleChange = (val: string = '') => {
    const { handleChangeText, fieldDesc } = this.props;
    let percentValue = null;
    this.inputValid(val);
    this.formValid(val);
    if (!_.isNaN(parseFloat(val))) {
      const x = new BigNumber(parseFloat(val));
      percentValue = x.dividedBy(100).toNumber();
    }

    handleChangeText(percentValue);
  };

  inputValid = (val: string) => {
    const { fieldDesc, title } = this.props;
    const integer_max_length = _.get(fieldDesc, 'integer_max_length', 3);
    const decimal_max_length = _.get(fieldDesc, 'decimal_max_length', 3);

    if (val === 0 || val === '') return;
    if (_.isNaN(parseFloat(val)) || _.indexOf(val, '.') !== _.lastIndexOf(val, '.')) {
      toastWaring(`请输入正确的${title}`);
    } else if (!_.includes(val, '.') && _.size(val) > integer_max_length) {
      toastWaring(`${title}的整数部分长度超出限制，限制位数：${integer_max_length}`);
    } else if (_.includes(val, '.')) {
      const splitInput = val.split('.');
      if (_.size(splitInput[0]) > integer_max_length) {
        toastWaring(`${title}的整数部分长度超出限制，限制位数：${integer_max_length}`);
      }
      if (_.size(splitInput[1]) > decimal_max_length) {
        toastWaring(`${title}的小数位长度超出限制，限制位数：${decimal_max_length}`);
      }
    }
  };

  formValid = (val: string = '') => {
    const { onChange } = this.props;
    if (onChange) {
      onChange(val);
    }
  };

  getvalidateColor = () => {
    const { validateFail = false } = this.props;
    if (validateFail) {
      return themes.input_color_require;
    } else {
      return themes.input_placeholder;
    }
  };

  getInputColor = () => {
    const { validateFail = false, disabled } = this.props;
    if (disabled) {
      return themes.input_disable_color;
    } else if (validateFail) {
      return themes.input_color_require;
    }
    return themes.input_color;
  };

  getContent = () => {
    const { content = '' } = this.props;
    if (content && !_.isNaN(parseFloat(content))) {
      const x = new BigNumber(parseFloat(content));
      return x.multipliedBy(100).toString();
    }
    return '';
  };

  render() {
    const { disabled } = this.props;
    const { paddingTop } = this.state;
    const content = this.getContent();
    return (
      <View
        style={{
          height: 30,
          justifyContent: 'center',
          flexDirection: 'row',
          alignContent: 'center',
          alignItems: 'center',
        }}
      >
        <Input
          underlineColorAndroid="transparent"
          defaultValue={content}
          style={{
            textAlign: 'right',
            fontSize: themes.font_size_base,
            paddingTop,
            paddingBottom: 0,
            alignItems: 'center',
            lineHeight: 15,
            color: this.getInputColor(),
          }}
          disabled={disabled}
          placeholder={disabled ? '' : I18n.t('Input.Enter')}
          onFocus={() => {
            this.setState({ paddingTop: 0 });
          }}
          onBlur={() => {
            this.setState({ paddingTop: 5 });
          }}
          keyboardType="numeric"
          placeholderTextColor={this.getvalidateColor}
          onChangeText={(val) => {
            this.handleChange(val);
          }}
        />
        {content ? <Text style={{ lineHeight: 15 }}>%</Text> : null}
      </View>
    );
  }
}
