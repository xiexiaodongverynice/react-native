/**
 * Created by Uncle Charlie, 2017/12/17
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import I18n from '../../i18n';
import themes from './theme';

export default class ErrorScreen extends React.Component {
  render() {
    const { callback } = this.props;

    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => callback && callback()}>
          <Text style={{ fontSize: 20 }}>{I18n.t('net_error')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themes.fill_base,
  },
});
