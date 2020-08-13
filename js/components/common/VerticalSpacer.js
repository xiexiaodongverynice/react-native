//@flow
import { View } from 'react-native';
import React from 'react';
//一个超简单的component，只需要传入height
// 比配置margin、padding更方便
export default function VerticalSpacer(props: { height: number, style?: {} }) {
  const style = { height: props.height };
  return <View style={[style, props.style]} />;
}
