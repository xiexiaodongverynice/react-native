/**
 * * CheckBox
 * @flow
 */

import _ from 'lodash';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import {
  IconChecked_ListView as IconChecked,
  IconUnchecked_ListView as IconUnchecked,
  IconCheckedDisabled_ListView as IconCheckedDisabled,
} from './IconCheckedUnchecked';

type Props = {
  style: object,
  onlyIconClick: boolean, //* 是否只能在Icon 触发点击事件
  handleCheck: void,
  checked: boolean,
  iconStyle: object,
  location?: 'left' | 'right',
  repetition?: boolean,
};

function IconComponent({ checked, iconStyle }: { checked: boolean, iconStyle: object }) {
  const iconElem = checked ? <IconChecked /> : <IconUnchecked />;
  return <View style={iconStyle}>{iconElem}</View>;
}

const CheckIconComponent = (props) => {
  const {
    checked,
    iconStyle,
    onlyIconClick = false,
    handleCheck = _.noop,
    repetition = false,
  } = props;

  if (repetition) {
    return <IconCheckedDisabled />;
  }

  if (onlyIconClick) {
    return (
      <TouchableOpacity onPress={handleCheck}>
        <IconComponent checked={checked} iconStyle={iconStyle} />
      </TouchableOpacity>
    );
  } else {
    return <IconComponent checked={checked} iconStyle={iconStyle} />;
  }
};

const ComponentView = (props: Props) => {
  const { location = 'left', children } = props;
  const compose = [];
  compose.push(<CheckIconComponent {...props} key="CheckboxItem" />);
  if (location === 'left') {
    compose.push(children);
  } else {
    compose.unshift(children);
  }
  return compose;
};

const CheckBoxView = (props: Props) => {
  const { onlyIconClick = false } = props;
  return onlyIconClick ? (
    <View style={[props.style || null]}>
      <ComponentView {...props} />
    </View>
  ) : (
    <TouchableOpacity
      onPress={() => {
        _.isFunction(props.handleCheck) && props.handleCheck();
      }}
      style={[props.style || null]}
    >
      <ComponentView {...props} />
    </TouchableOpacity>
  );
};

export default CheckBoxView;
