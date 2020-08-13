import { TouchableWithoutFeedback, View, Keyboard } from 'react-native';
import React from 'react';

// 点击背景关闭键盘。
// 原理很简单：就是在外面添加了Touchable，点击后关闭键盘。
// 所有的props都传递给内部的View，包括children
export default function DismissKeyboardView(props) {
  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View {...props} />
    </TouchableWithoutFeedback>
  );
}
