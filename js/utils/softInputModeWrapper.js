/*  eslint-disable */
//核心功能就是调用 android.view.Window 中的 public void setSoftInputMode (int mode)
//react-native-set-soft-input-mode的开发者没有进行条件判断，如果直接使用，在ios上会崩溃
//需要自己进行判断
import { Platform } from 'react-native';
const isAndroid = Platform.OS === 'android';
let SoftInputMode;
export let isNativeModuleAvailable = false;

if (isAndroid) {
  SoftInputMode = require('react-native-set-soft-input-mode').default;
  if (SoftInputMode) {
    const hasSetFunction = typeof SoftInputMode.set === 'function';
    isNativeModuleAvailable = hasSetFunction; //有set函数，就认为native module可用
  }
}

export function setTo_ADJUST_NOTHING_ifAndroid() {
  if (isAndroid && isNativeModuleAvailable) {
    SoftInputMode.set(SoftInputMode.ADJUST_NOTHING);
  }
}

export function setTo_ADJUST_PAN_ifAndroid() {
  if (isAndroid && isNativeModuleAvailable) {
    SoftInputMode.set(SoftInputMode.ADJUST_PAN);
  }
}

export function setTo_ADJUST_RESIZE_ifAndroid() {
  if (isAndroid && isNativeModuleAvailable) {
    SoftInputMode.set(SoftInputMode.ADJUST_RESIZE);
  }
}

export function setTo_setTo_ADJUST_UNSPECIFIED_ifAndroid() {
  if (isAndroid && isNativeModuleAvailable) {
    SoftInputMode.set(SoftInputMode.ADJUST_UNSPECIFIED);
  }
}
