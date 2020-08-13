//在scrollview顶部展示，表示页面刷新中
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Spinner } from 'native-base';

export default function SpinnerHeader() {
  return (
    <View style={[styles.container, styles.headerHeight]}>
      <Spinner color="blue" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  headerHeight: {
    height: 44,
  },
});
