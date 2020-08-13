/**
 * Created by Guanghua on 12/20;
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Spinner } from 'native-base';
import I18n from '../../i18n';
import themes from './theme';

export default class LoadingScreen extends React.PureComponent {
  render() {
    // Normal size means not full screen
    const { isNormalSized } = this.props;
    return (
      <View
        style={[
          styles.container,
          !isNormalSized
            ? { flex: 1, justifyContent: 'center', alignItems: 'center' }
            : { height: 60 },
        ]}
      >
        <Spinner color="blue" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themes.fill_base,
  },
  text: {
    fontSize: 16,
  },
});
