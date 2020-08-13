//演示TextInput使用,onChangeText调用很快
import assert from './utils/assert0';
import _ from 'lodash';
import React, { Component } from 'react';
import { View, Text, StyleSheet, StatusBar, TextInput, Dimensions } from 'react-native';

const WINDOW_HEIGHT = Dimensions.get('window').height;

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = { text: '', bottomBgLayout: null };
  }

  onChangeText(text) {
    this.setState({ text: text });
  }

  renderBottombg() {
    const style = {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    };
    return (
      <View style={style}>
        <Text>123123123123 bottom bg</Text>
      </View>
    );
  }
  render() {
    return (
      <View style={styles.container} notExistKey>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <Text>1111112312312</Text>
        <View style={{ height: 30 }} />
        <TextInput
          style={{ height: 200, borderWidth: 1 }}
          onChangeText={(text) => this.onChangeText(text)}
        />

        <Text>{'displayAtHere:' + this.state.text}</Text>
        {this.renderBottombg()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
