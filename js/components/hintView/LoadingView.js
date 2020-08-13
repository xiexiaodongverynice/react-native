import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Spinner } from 'native-base';
import theme from '../../tabs/common/theme';

const LoadingView = () => (
  <View style={[styles.container, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
    <Spinner color="blue" />
  </View>
);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.fill_base,
  },
  text: {
    fontSize: 16,
  },
});

export default LoadingView;
