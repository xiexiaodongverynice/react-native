/**
 * @flow
 */
import React, { Component } from 'react';
import {
  View,
  Platform,
  StatusBar, // only for android
  NativeModules,
} from 'react-native';

const StatusBarManager = NativeModules.StatusBarManager; // only for ios
const ABOVE_LOLIPOP = Platform.Version && Platform.Version > 19;
export const STATUS_BAR_HEIGHT = isIOS ? (isAboveIPhone8 ? 44 : 20) : StatusBar.currentHeight;

const getStatusBarHeight = () =>
  new Promise((resolve, reject) => {
    if (isIOS) {
      StatusBarManager.getHeight((result) => {
        resolve({ platform: 'ios', height: result.height });
      });
    } else {
      resolve({ platform: 'android', height: StatusBar.currentHeight });
    }
  });

type Props = {
  isTranslucent?: boolean,
  barTintColor?: string,
  children?: any,
  style?: number | Object,
};

type State = {
  statusBarHeight: number,
};

export default class extends Component<Props, State> {
  state = {
    statusBarHeight: STATUS_BAR_HEIGHT,
  };

  static defaultProps = {
    barTintColor: 'transparent',
    isTranslucent: true,
  };

  render() {
    const { statusBarHeight } = this.state;
    const { isTranslucent, barTintColor, children, style } = this.props;

    const needStatusBar = isIOS || (ABOVE_LOLIPOP && isTranslucent);
    const statusHeight = needStatusBar ? statusBarHeight : 0;

    return (
      <View style={[{ backgroundColor: barTintColor }, style]}>
        <View style={{ height: statusHeight }} />
        <View
          onLayout={() =>
            getStatusBarHeight().then((result) => this.setState({ statusBarHeight: result.height }))
          }
        >
          {children}
        </View>
      </View>
    );
  }
}
