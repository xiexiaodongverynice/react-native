//@flow
import { AsyncStorage } from 'react-native';
import _ from 'lodash';
import DeviceInfo from 'react-native-device-info';
import assert from './assert0';

const appName: string = DeviceInfo.getApplicationName().toLowerCase(); //用小写来比较
let license_url_user = null;
let license_url_privacy = null;
if (appName.includes('crmpower')) {
  license_url_user = 'https://fcstatic.crmpower.cn/prod/h5_user_agreement.html';
  license_url_privacy = 'https://fcstatic.crmpower.cn/prod/h5_privacy_statement.html';
} else if (appName.includes('bms')) {
  //影像BMS，客户为恒瑞医药
  license_url_user = 'https://fcstatic.crmpower.cn/hrs/h5_user_agreement.html';
  license_url_privacy = 'https://fcstatic.crmpower.cn/hrs/h5_privacy_statement.html';
} else if (appName.includes('bipower')) {
  //信谊-信谊BIpower
  license_url_user = 'https://fcstatic.crmpower.cn/sinepharm/h5_user_agreement.html';
  license_url_privacy = 'https://fcstatic.crmpower.cn/sinepharm/h5_privacy_statement.html';
}

assert(_.isString(license_url_user), '必须提供用户协议');
assert(_.isString(license_url_privacy), '必须提供隐私协议');

const asKey = 'licenseUtil.js-licenseAgreed';

export async function getLicenseAgreed() {
  const value = await AsyncStorage.getItem(asKey);
  const agreed = Boolean(value);
  return agreed;
}

export function setLicenseAgreed(agreed) {
  const value = _.toString(agreed);
  AsyncStorage.setItem(asKey, value);
}

export function toWebView(userOrPrivacy, navigation) {
  const url = userOrPrivacy === 'user' ? license_url_user : license_url_privacy;
  const label = userOrPrivacy === 'user' ? '用户协议' : '隐私政策';
  navigation.navigate('WebView', {
    navParam: {
      label,
      external_page_src: url,
      showBack: true,
    },
  });
}
