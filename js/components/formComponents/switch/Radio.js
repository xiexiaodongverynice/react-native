/* eslint-disable global-require,  import/no-unresolved */
/**
 * Created by Uncle Charlie, 2018/01/31
 * @flow
 */

import React from 'react';
import { TouchableWithoutFeedback, Image, Text, View, StyleSheet } from 'react-native';
// import RadioStyle from './styles';

type Prop = {
  style?: any,
  styles: any,
  defaultChecked?: boolean,
  checked?: boolean,
  disabled?: boolean,
  onChange?: Function,
  // name?: string,
  // wrapLabel?: boolean,
  children: ?Array<any>,
};

type State = {
  checked: boolean,
};

// const RadioStyles = StyleSheet.create(RadioStyle);

export default class Radio extends React.Component<Prop, State> {
  static defaultProps = {
    styles: {},
  };

  constructor(props: Prop) {
    super(props);
    this.state = {
      checked: props.checked || props.defaultChecked || false,
    };
  }

  static getDerivedStateFromProps(nextProps: Prop) {
    if ('checked' in nextProps) {
      return {
        checked: !!nextProps.checked,
      };
    }
  }

  handleClick = () => {
    if (this.props.disabled) {
      return;
    }

    if (!('checked' in this.props)) {
      this.setState({
        checked: true,
      });
    }

    if (this.props.onChange) {
      this.props.onChange({ target: { checked: true } });
    }
  };

  render() {
    const { style, disabled, children } = this.props;
    const { styles } = this.props;

    const { checked } = this.state;
    let imgSrc = null;
    if (checked) {
      if (disabled) {
        // $FlowFixMe: image
        imgSrc = require('./image/checked_disable.png');
      } else {
        // $FlowFixMe: image
        imgSrc = require('./image/checked.png');
      }
    }
    return (
      <TouchableWithoutFeedback onPress={this.handleClick}>
        <View style={[styles.wrapper]}>
          <Image source={imgSrc} style={[styles.icon, style]} />
          {typeof children === 'string' ? <Text>{this.props.children}</Text> : children}
        </View>
      </TouchableWithoutFeedback>
    );
  }
}
