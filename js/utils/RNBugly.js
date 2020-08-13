//@flow
import { NativeModules, Platform } from 'react-native';

const Native_RNBugly = NativeModules.RNBugly;
if (!Native_RNBugly.reportJSError) {
  throw new Error('未发现native method，似乎没有编译最新OC/java代码');
}

const RNBugly = {
  setUserIdentifier(userId: string): void {
    return Native_RNBugly.setUserIdentifier(userId);
  },
  updateAppVersion(version: string): void {
    return Native_RNBugly.updateAppVersion(version);
  },

  //Error.prototype.stack在android上会导致崩溃 com.facebook.react.bridge.NoSuchKeyException
  //所以不再上传stack
  reportJSError(jserror: Error): void {
    if (__DEV__) {
      return;
    }
    const name = jserror.name;
    let message = jserror.message;
    const stack = 'can not read stack';
    if (Platform.OS === 'android') {
      //android中的name是没用的，将name加入到message中。
      message = `${name}:${message}`;
    }
    const errExtracted = { name, message, stack };
    return Native_RNBugly.reportJSError(errExtracted);
  },
};

export default RNBugly;
