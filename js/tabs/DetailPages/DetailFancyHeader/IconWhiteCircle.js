//@flow

import React, { Component } from 'react';
import { View } from 'react-native';
import IcomoonIcon from '../../../lib/IcomoonIcon';

//一个图标，背景是白色的
type typeProps = {
  icon_color: string,
  icon: string, //即icon name
};

//背景是白色圆，上面一个icon。用于显示头像
export default function IconWhiteCircle(props: typeProps) {
  const iconStyle = {
    color: props.icon_color,
  };
  return (
    <View style={[styles.wh80, styles.whiteBg, styles.center, styles.border1Gray]}>
      <IcomoonIcon style={[styles.fontSize50, iconStyle]} name={props.icon} />
    </View>
  );
}

const styles = {
  wh80: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  whiteBg: {
    backgroundColor: 'white',
  },
  fontSize50: {
    fontSize: 50,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  border1Gray: {
    borderColor: '#E4E4E4',
    borderWidth: 1,
  },
};
