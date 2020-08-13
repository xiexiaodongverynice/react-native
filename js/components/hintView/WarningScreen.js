/**
 * Create by Uncle Charlie, 6/1/2018
 * @flow
 */

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type Prop = {
  content: string,
  callback?: () => void,
};

/*
 Warning user that he/she may have no right to access something etc.
 */
export default class WarningScreen extends React.PureComponent<Prop, {}> {
  handlePress = () => {
    const { callback } = this.props;
    if (callback) {
      callback();
    }
  };

  render() {
    const { content } = this.props;

    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <TouchableOpacity onPress={this.handlePress}>
          <Text>{content}</Text>
        </TouchableOpacity>
      </View>
    );
  }
}
