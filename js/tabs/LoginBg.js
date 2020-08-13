/*  eslint-disable */
//登录页背景图

import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import {
  setTo_ADJUST_PAN_ifAndroid,
  setTo_ADJUST_RESIZE_ifAndroid,
} from '../utils/softInputModeWrapper';
import DismissKeyboardView from '../components/formComponents/DismissKeyboardView';
import { suitableHeightFromIPXHeight } from '../utils/util';
import VerticalSpacer from '../components/common/VerticalSpacer';

//底部图片
function BottomBgImageView() {
  const bottomBgImageObj = Image.resolveAssetSource(require('./img/LoginScreen_bottomBg.png'));
  const { uri, width, height } = bottomBgImageObj;
  const DEVICE_WIDTH = Dimensions.get('window').width;

  const aspectHeight = Math.round((height * DEVICE_WIDTH) / width);
  const style = {
    resizeMode: 'cover',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: DEVICE_WIDTH,
    height: aspectHeight,
  };
  return <Image source={{ uri }} style={style} />;
}

export default class LoginBg extends React.PureComponent {
  componentDidMount() {
    setTo_ADJUST_PAN_ifAndroid();
  }

  componentWillUnmount() {
    setTo_ADJUST_RESIZE_ifAndroid();
  }

  render() {
    const copyrightStr = '©2019 云势软件 版权所有 | 京ICP备17004747号-1';
    return (
      <DismissKeyboardView style={styles.container}>
        {/*两个绝对定位的元素*/}
        <BottomBgImageView />
        <Text style={styles.copyright}>{copyrightStr}</Text>

        <VerticalSpacer height={suitableHeightFromIPXHeight(80)} />
        <View style={[styles.center, styles.border1]}>
          <Image style={styles.border1} source={require('./img/LoginScreen_logo.png')} />
        </View>
        <VerticalSpacer height={suitableHeightFromIPXHeight(66)} />

        {this.props.children}

        <View style={{ flex: 1 }} />
        {/*nativebase中提供的组件经常有flex，所以这里也必须有一个 { flex: 1 }*/}
      </DismissKeyboardView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'stretch', //将item水平拉伸
    paddingTop: 20,
    paddingLeft: 30,
    paddingRight: 30,
    backgroundColor: 'white',
  },
  border1: {
    // borderWidth: 1,
    // borderColor: 'black',
    // borderStyle: 'solid',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyright: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 45,
    fontSize: 12,
    textAlign: 'center',
    color: '#666666',
  },
});
