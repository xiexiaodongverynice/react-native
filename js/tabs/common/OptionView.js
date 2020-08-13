/*
 Created by Uncle Charlie, 2017/12/22
 @flow
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { connect } from 'react-redux';

// Deprecated
class OptionView extends React.Component {
  render() {
    const { selectedOption, content } = this.props;
    const displayVal = selectedOption ? selectedOption.value : content;

    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => console.log('===>option start')}>
          <Text>{displayVal}</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

export default connect()(OptionView);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
});
