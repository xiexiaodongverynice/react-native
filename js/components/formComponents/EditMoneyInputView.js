/**
 * * 货币输入框
 * @flow
 */
/*  eslint-disable */

import React, { Component } from 'react';
import _ from 'lodash';
import { View, StyleSheet, Text, TextInput } from 'react-native';
import Input from '../../lib/Input';
import themes from '../../tabs/common/theme';
import assert from '../../utils/assert0';
import I18n from '../../i18n';

type PropsType = {
  //value、onChange、validateFail 是 createField 添加的
  value: string,
  validateFail: boolean,
  onChange: (text: string) => void, // Component会在合适的时机调用onChange方法，rc-form需要它来collect数据

  //custome
  disabled: boolean,
  handleChangeText: (text: string) => void, //
  type: string,
  fieldLayout: {
    symbol: string, //* 货币符号
  },
};

function replaceAll(target, str, newstr) {
  return target.replace(new RegExp(str, 'g'), newstr);
}

// 千位增加逗号
function formatNumberStr(num: string): string {
  assert(_.every(num, (x) => '0123456789'.includes(x))); // 必须提供整数！即只能包含0-9
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

//只对整数部分添加千位逗号
function formatDefaultValue(value: string): string {
  const text = _.defaultTo(value, ''); //可能传入undefined
  // assert(!text.includes(',')); //不应包含逗号
  // assert(!text.includes('e')); //不能有e
  if (text.length < 4) {
    return text;
  }

  const pos = `${text}`.indexOf('.');
  if (pos === -1) {
    //没有. 都是整数
    const formattedValue = formatNumberStr(text);
    return formattedValue;
  } else if (pos < 4) {
    //有点，但整数部分小于4个，不进行格式化
    return text;
  } else {
    //需要格式化
    const intPart = text.substr(0, pos);
    const decimalPart = text.substr(pos + 1);
    const formattedIntPart = formatNumberStr(intPart);
    const formattedValue = formattedIntPart + '.' + decimalPart;
    return formattedValue;
  }
}

const _getTextColor = ({ validateFail, disabled, isPlaceholder }) => {
  if (disabled) {
    return themes.input_disable_color;
  } else if (validateFail) {
    return themes.input_color_require;
  } else {
    return isPlaceholder ? themes.input_placeholder : themes.input_color;
  }
};

class EditMoneyInputView extends Component<PropsType, { isEditing: boolean }> {
  _onChangeText(text: string) {
    //text中可能包含逗号-+，去掉后就是intStr
    const { onChange, handleChangeText } = this.props;
    assert(_.isString(text));

    let textAfterTrim = '';
    _.forEach(text, (char0) => {
      if ('0123456789.'.includes(char0)) {
        textAfterTrim += char0;
      }
    });
    onChange(textAfterTrim);
    handleChangeText(textAfterTrim);
  }
  render() {
    const { value, disabled, type, validateFail, fieldLayout } = this.props;
    const symbol = _.get(fieldLayout, 'symbol', '');

    let defaultValue = formatDefaultValue(value);
    assert(!defaultValue.includes('e'), '不应包含e');
    assert(_.isString(defaultValue));
    if (_.size(symbol) > 0) {
      assert(!defaultValue.includes(symbol), '不应该包含symbol,symbol:' + symbol);
    }
    if (defaultValue.length > 0) {
      defaultValue = `${symbol}${defaultValue}`;
    }
    const textColor = _getTextColor({ validateFail, disabled });
    const placeholderColor = _getTextColor({ validateFail, disabled, isPlaceholder: true });

    //Number.MAX_SAFE_INTEGER // 9007199254740991，加上千位逗号共21个字符
    //这里maxLength设置25位应该足够了
    return (
      <View style={{ height: 30, justifyContent: 'center' }}>
        <Input
          numberOfLines={1}
          multiline={false}
          maxLength={25}
          underlineColorAndroid="transparent"
          style={[
            styles.override_NativeBase_Input_Default,
            styles.inputStyle,
            { color: textColor },
          ]}
          disabled={disabled}
          placeholder={disabled ? '' : I18n.t('Input.Enter')}
          keyboardType="numeric"
          onChangeText={this._onChangeText.bind(this)}
          placeholderTextColor={placeholderColor}
          defaultValue={defaultValue}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  override_NativeBase_Input_Default: {
    //用来覆盖NativeBase default theme
    height: 30,
    // color: , //根据state动态配置
    paddingLeft: 0,
    // paddingRight: 0, //native-base默认是5
    fontSize: themes.font_size_base,
  },
  inputStyle: {
    textAlign: 'right',
    paddingTop: 0,
    paddingBottom: 0,
    paddingVertical: 0,
    justifyContent: 'center',
    lineHeight: 15,
  },
});

export default EditMoneyInputView;
