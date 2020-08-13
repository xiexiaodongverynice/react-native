/**
 * @flow
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  style?: number | Object,
  children?: any,
};

export default (props: Props) => (
  <View style={[styles.container, props.style]}>{props.children}</View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginBottom: 10,
    padding: 10,
  },
});
