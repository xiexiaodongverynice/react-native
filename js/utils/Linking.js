/**
 * Created by poberwong on 2019-06-12.
 */

import { Linking } from 'react-native';
import { baiduMapUrl } from './util';

export default {
  canOpenURL: Linking.canOpenURL,
  openURL: Linking.openURL,
  openUrlWithCheck: (url) =>
    Linking.canOpenURL(url).then((support) => {
      if (!support) {
        return Promise.reject(new Error("can't open url"));
      } else {
        return Linking.openURL(url);
      }
    }),
  checkForBaiduMap: () => Linking.canOpenURL(baiduMapUrl),
};
