/**
 * @flow
 */
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { CustomTouch } from '../../lib/androidWebview';
import theme from '../../utils/theme';

type Props = {
  style?: number | Object,
  title?: string,
  actionTitle?: string,
  onAction?: () => void,
  children?: any,
};

export default ({ style, title, actionTitle, onAction, children }: Props) => (
  <View style={[styles.container, style]}>
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {!!onAction && (
        <CustomTouch onPress={onAction}>
          <Text style={styles.action}>{actionTitle || '查看全部'}</Text>
        </CustomTouch>
      )}
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginBottom: 10,
    padding: 10,
  },
  header: {
    paddingVertical: 5,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontFamily: 'PingFangSC-Semibold',
    color: '#333',
  },
  action: {
    fontSize: theme.baseFontSize,
    fontFamily: 'PingFangSC-Regular',
    color: '#4cb7ff',
  },
});
