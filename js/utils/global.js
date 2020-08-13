/**
 * 可以在编译时绑定到 global 上的一些全局常量，与业务无关。
 * @flow
 */
import { Platform, Dimensions } from 'react-native';

/**
 * platform detection
 */
global.isAndroid = Platform.OS === 'android';

global.isIOS = Platform.OS === 'ios';

function detectIPhone() {
  if (global.isIOS) {
    const DeviceInfo = require('react-native-device-info').default;
    return /11|X/.test(DeviceInfo.getModel());
  }
  return false;
}

const isAboveIPhone8 = detectIPhone();

global.isAboveIPhone8 = isAboveIPhone8;

/**
 * navbar
 */
global.NAV_BAR_HEIGHT = global.isIOS ? 44 : 56;

/**
 * screen width
 */
const { width, height } = Dimensions.get('window');
global.SCREEN_WIDTH = width;
global.SCREEN_HEIGHT = height;
