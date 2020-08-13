/*eslint-disable */
import { View, StyleSheet } from 'react-native';
import React from 'react';
//随机添加边框，用于调试

function randColor() {
  const color = '#' + (0x1000000 + Math.random() * 0xffffff).toString(16).substr(1, 6);
  return color;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

export default class DebugView extends React.Component {
  constructor(props) {
    super(props);

    const borderColor = randColor();
    const borderWidth = getRandomInt(1, 3);
    this.style = { borderColor, borderWidth };
  }

  render() {
    const styleMerged = StyleSheet.compose(this.props.style, this.style);
    return (
      <View {...this.props} style={styleMerged}>
        {this.props.children}
      </View>
    );
  }
}
