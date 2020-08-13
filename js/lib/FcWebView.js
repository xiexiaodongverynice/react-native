/**
 * @flow
 */
import React from 'react';
import { View, WebView } from 'react-native';

type Props = {
  style?: Object,
};
export default (props: Props) => (
  <View style={[{ flex: 1, overflow: 'hidden' }, props.style]}>
    <WebView {...props} />
  </View>
);
