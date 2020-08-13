//@flow
/* eslint-disable no-jsx-curly-brace-presence */
/* eslint-disable react/jsx-curly-brace-presence */

import React from 'react';
import _ from 'lodash';
import DeviceInfo from 'react-native-device-info';
import { View, Text, TouchableHighlight, TouchableOpacity } from 'react-native';
import { toWebView } from '../../utils/licenseUtil';
import { toastDefaultCenter } from '../../utils/toast';
import I18n from '../../i18n';

function Header() {
  return (
    <View
      style={[
        styles.height44,
        styles.flexDirectionRow,
        styles.alignItemsCenter,
        styles.paddingLR12,
      ]}
    >
      <Text style={[styles.color333, styles.fontSize14, styles.fontWeightBold]}>
        软件许可及服务协议
      </Text>
    </View>
  );
}

type typeOnlyNavigation = {
  navigation: any,
};

function Content(props: typeOnlyNavigation) {
  function replaceAll(target, str, newstr) {
    return target.replace(new RegExp(str, 'g'), newstr);
  }
  const appName = DeviceInfo.getApplicationName();
  let tipstr = '欢迎使用%s软件。\n\n%s非常重视你的个人信息与隐私保护并特向你说明：\n';
  tipstr += '1.%s会根据合法、正当、必要的原则，仅收集用户实现产品功能所必需的个人信息。\n';
  tipstr += '2.未经你的授权同意，%s不会向任何第三方提供你的用户信息。\n';
  tipstr += '3.你可查看、更改你的个人信息，也可通过反馈渠道注销账号。\n';
  tipstr += '登陆及使用%s代表你对本协议的确认。\n';
  tipstr += '你可查看完整的';
  tipstr = replaceAll(tipstr, '%s', appName);
  return (
    <View style={[styles.paddingLR12, styles.paddingTB12]}>
      <Text style={[styles.fontSize12, styles.color555, styles.lineHeight17]}>
        {tipstr}
        <TextUserLicense navigation={props.navigation} />
        {'与'}
        <TextPrivacyLicense navigation={props.navigation} />
        {'。'}
      </Text>
    </View>
  );
}

function TextUserLicense(props: typeOnlyNavigation) {
  const str = '《CRMpower用户协议通知》';
  return (
    <Text style={styles.colorLink} onPress={() => toWebView('user', props.navigation)}>
      {str}
    </Text>
  );
}

function TextPrivacyLicense(props: typeOnlyNavigation) {
  const str = '《CRMpower隐私声明》';
  return (
    <Text style={styles.colorLink} onPress={() => toWebView('privacy', props.navigation)}>
      {str}
    </Text>
  );
}

function renderButton(isAgree: boolean, onPress: () => void) {
  //agree为true返回同意按钮，false返回不同意按钮
  const str = isAgree ? '同意' : '不同意';
  const color = isAgree ? '#56A8F7' : '#999999';
  const textStyle = { color };
  return (
    <TouchableHighlight
      underlayColor={'#cccccc'}
      style={[styles.center, styles.flex1, styles.height100p]}
      onPress={onPress}
    >
      <Text style={textStyle}>{str}</Text>
    </TouchableHighlight>
  );
}

const throttled_toastDefaultCenter = _.throttle(toastDefaultCenter, 2000);
function disagreeClicked() {
  const str = '需要点击同意后，才可以使用';
  throttled_toastDefaultCenter(str);
}

function GrayBar() {
  return <View style={[styles.height24, styles.width1, styles.bgEEE]} />;
}

function Line1px() {
  return <View style={[styles.width100p, styles.height1, styles.bgEEE]} />;
}

type typeOnAgree = {
  onAgree: () => void,
};
function TwoBtn(props: typeOnAgree) {
  return (
    <View style={[styles.flexDirectionRow, styles.alignItemsCenter, styles.bgFA, styles.height44]}>
      {renderButton(false, () => disagreeClicked())}
      <GrayBar />
      {renderButton(true, props.onAgree)}
    </View>
  );
}

//一个浮层，绝对定位，用于显示【软件许可及服务协议】
type typeProps = {
  navigation: any,
  onAgree: () => void,
};
export default function LicenseLayer(props: typeProps) {
  return (
    <View style={[styles.absoluteFill, styles.alpha03, styles.center]}>
      <View style={[styles.width265, styles.bgWhite, styles.borderRadius4, styles.overflowHidden]}>
        <Header />
        <Line1px />
        <Content navigation={props.navigation} />
        <TwoBtn onAgree={props.onAgree} />
      </View>
    </View>
  );
}

export function ViewLicenseRow(props: typeOnlyNavigation) {
  return (
    <View style={[styles.flexDirectionRow]}>
      <Text style={[styles.fontSize12, styles.color333]}>{I18n.t('LicenseLayer.TapToView')}</Text>
      <TouchableOpacity onPress={() => toWebView('user', props.navigation)}>
        <Text style={[styles.fontSize12, styles.colorLink]}>
          {I18n.t('LicenseLayer.User_Agreement')}
        </Text>
      </TouchableOpacity>
      <Text style={[styles.fontSize12, styles.color333]}>{I18n.t('LicenseLayer.And')}</Text>
      <TouchableOpacity onPress={() => toWebView('privacy', props.navigation)}>
        <Text style={[styles.fontSize12, styles.colorLink]}>
          {I18n.t('LicenseLayer.Privacy_Policy')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  overflowHidden: {
    overflow: 'hidden',
  },
  borderRadius4: {
    borderRadius: 4,
  },
  alpha03: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  width265: {
    width: 265,
  },
  bgWhite: {
    backgroundColor: 'white',
  },
  color333: {
    color: '#333333',
  },
  color555: {
    color: '#555555',
  },
  fontSize14: {
    fontSize: 14,
  },
  fontSize12: {
    fontSize: 12,
  },
  height44: {
    height: 44,
  },
  height1: {
    height: 1,
  },
  height24: {
    height: 24,
  },
  width1: {
    width: 1,
  },
  flexDirectionRow: {
    flexDirection: 'row',
  },
  fontWeightBold: {
    fontWeight: 'bold',
  },
  alignItemsCenter: {
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgEEE: {
    backgroundColor: '#EEEEEE',
  },
  bgFA: {
    backgroundColor: '#FAFAFA',
  },
  flex1: {
    flex: 1,
  },
  width100p: {
    width: '100%',
  },
  height100p: {
    height: '100%',
  },
  paddingLR12: {
    paddingLeft: 12,
    paddingRight: 12,
  },
  paddingTB12: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  colorLink: {
    color: '#4C9EF6',
  },
  lineHeight17: {
    lineHeight: 17,
  },
};
