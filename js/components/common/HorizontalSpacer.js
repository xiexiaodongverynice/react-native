//@flow
import { View } from 'react-native';
import React from 'react';
//一个超简单的component，只需要传入width
// 比配置margin、padding更方便
export default function HorizontalSpacer(props: { width: number, style: {} }) {
  const style = { width: props.width };
  return <View style={[style, props.style]} />;
}
