import React from 'react';
import { View, Platform, TouchableOpacity } from 'react-native';
import moment from 'moment';

const CustomTouch = ({ style = {}, children = null, onPress = () => {} }) => {
  let pageY = 0;
  let pageX = 0;
  let time = 0;
  return Platform.OS == 'ios' ? (
    <TouchableOpacity onPress={onPress} style={style}>
      {children}
    </TouchableOpacity>
  ) : (
    <View
      style={style}
      onStartShouldSetResponder={(event) => true}
      onMoveShouldSetResponder={(event) => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(event) => {
        pageY = event.nativeEvent.pageY;
        pageX = event.nativeEvent.pageX;
      }}
      onResponderRelease={(event) => {
        const upPageY = event.nativeEvent.pageY;
        const upPageX = event.nativeEvent.pageX;
        const currentTime = moment().valueOf();
        if (
          Math.abs(upPageY - pageY) < 5 &&
          Math.abs(upPageX - pageX) < 5 &&
          currentTime - time > 2000
        ) {
          onPress();
          pageY = 0;
          pageX = 0;
          time = moment().valueOf();
        }
      }}
    >
      {children}
    </View>
  );
};

export default CustomTouch;
