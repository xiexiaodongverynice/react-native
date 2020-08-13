/**
 * @flow
 */

import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import {
  IconChecked_ListView as IconChecked,
  IconUnchecked_ListView as IconUnchecked,
  IconCheckedDisabled_ListView as IconCheckedDisabled,
} from '../../../components/common/IconCheckedUnchecked';

type Props = {
  checked: boolean,
  handleCheck: any,
  children: any,
  location: 'left' | 'right', //Icon位置，左侧或右侧
  disabled: boolean,
  style: any,
  iconStyle: any,
  repetition: boolean,
};

//它是作为容器使用的！左边显示按钮，右边显示chidren
export default class CheckBox extends React.Component<Props, {}> {
  _handleChange = () => {
    const { disabled, handleCheck } = this.props;
    if (!disabled) {
      handleCheck();
    }
  };

  renderCheckboxConcrete = () => {
    const { checked, repetition = false } = this.props;
    if (repetition) {
      //* 不可选并显示对应icon
      return <IconCheckedDisabled />;
    }
    return checked ? <IconChecked /> : <IconUnchecked />;
  };

  renderCheckbox = () => {
    const concrete = this.renderCheckboxConcrete();
    return <View style={this.props.iconStyle}>{concrete}</View>;
  };
  renderComponents = () => {
    const { location = 'left', children } = this.props;
    const components = [];
    components.push(this.renderCheckbox());
    if (location === 'left') {
      components.push(children);
    } else {
      components.unshift(children);
    }
    return components;
  };

  render() {
    return (
      <TouchableOpacity
        onPress={this._handleChange}
        style={[this.props.style, styles.alignItemsCenter]}
      >
        {this.renderComponents()}
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  alignItemsCenter: {
    alignItems: 'center',
  },
});
