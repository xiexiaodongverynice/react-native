/**
 * Created by Uncle Charlie, 2018/01/23
 * @flow
 */
import React from 'react';
import { View, Text } from 'react-native';
import { Textarea } from 'native-base';
import Constants from './Constants';

export default class ComponentField extends React.Component<any, any> {
  getControls(children: any, recursively: boolean) {
    let controls: Array<any> = [];
    const childrenArray = React.Children.toArray(children);
    for (let i = 0; i < childrenArray.length; i++) {
      if (!recursively && controls.length > 0) {
        break;
      }

      const child = childrenArray[i];
      if (child.type && child.type.name === 'ComponentField') {
        continue;
      }
      if (!child.props) {
        continue;
      }
      if (Constants.FIELD_META_PROP in child.props) {
        // And means FIELD_DATA_PROP in chidl.props, too.
        controls.push(child);
      } else if (child.props.children) {
        controls = controls.concat(this.getControls(child.props.children, recursively));
      }
    }
    return controls;
  }

  getOnlyControl() {
    const child = this.getControls(this.props.children, false)[0];
    return child !== undefined ? child : null;
  }

  getChildProp(prop: string) {
    const child = this.getOnlyControl();
    return child && child.props && child.props[prop];
  }

  getField() {
    return this.getChildProp(Constants.FIELD_DATA_PROP);
  }

  getMeta() {
    return this.getChildProp(Constants.FIELD_META_PROP);
  }

  getValidateStatus() {
    const onlyControl = this.getOnlyControl();
    if (!onlyControl) {
      return '';
    }
    const field = this.getField();
    if (field.validating) {
      return 'validating';
    }
    if (field.errors) {
      return 'error';
    }
    const fieldValue = 'value' in field ? field.value : this.getMeta().initialValue;
    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
      return 'success';
    }
    return '';
  }

  renderChildren = (validateStatus: string) => {
    if (validateStatus === 'error') {
      return React.cloneElement(this.props.children, {
        validateFail: true,
      });
    } else {
      return this.props.children;
    }
  };

  render() {
    const validateStatus = this.getValidateStatus();
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'stretch',
          alignSelf: 'stretch',
        }}
      >
        {this.renderChildren(validateStatus)}
      </View>
    );
  }
}
