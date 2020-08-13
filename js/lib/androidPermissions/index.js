// @flow
import { NativeModules, PermissionsAndroid, Platform, AsyncStorage } from 'react-native';

/**
 * version: 1.2.0
 * url: https://github.com/react-native-community/react-native-permissions
 */
export type PermissionStatus = 'authorized' | 'denied' | 'restricted' | 'undetermined';

export type Rationale = {
  title: string,
  message: string,
  buttonPositive?: string,
  buttonNegative?: string,
  buttonNeutral?: string,
};

const ASYNC_STORAGE_KEY = '@RNPermissions:didAskPermission:';

const PERMISSIONS = Platform.select({
  android: {
    callPhone: PermissionsAndroid.PERMISSIONS.CALL_PHONE,
    camera: PermissionsAndroid.PERMISSIONS.CAMERA,
    coarseLocation: PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    contacts: PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
    event: PermissionsAndroid.PERMISSIONS.READ_CALENDAR,
    location: PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    microphone: PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    photo: PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    readSms: PermissionsAndroid.PERMISSIONS.READ_SMS,
    receiveSms: PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    sendSms: PermissionsAndroid.PERMISSIONS.SEND_SMS,
    storage: PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    readPhoneState: PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
  },
});

const ANDROID_RESULTS = {
  granted: 'authorized',
  denied: 'denied',
  never_ask_again: 'restricted',
};

const setDidAskOnce = (permission: string) =>
  AsyncStorage.setItem(ASYNC_STORAGE_KEY + permission, 'true');

const getDidAskOnce = (permission: string) =>
  AsyncStorage.getItem(ASYNC_STORAGE_KEY + permission).then((item) => !!item);

class ReactNativePermissions {
  // eslint-disable-next-line class-methods-use-this
  getTypes(): string[] {
    return Object.keys(PERMISSIONS);
  }

  check = (permission: string, options?: string | { type?: string }): Promise<PermissionStatus> => {
    if (!PERMISSIONS[permission]) {
      return Promise.reject(
        new Error(`ReactNativePermissions: ${permission} is not a valid permission type`),
      );
    }

    if (Platform.OS === 'android') {
      return PermissionsAndroid.check(PERMISSIONS[permission]).then((granted) => {
        if (granted) {
          return 'authorized';
        }

        return getDidAskOnce(permission).then((didAsk) => {
          if (didAsk) {
            return NativeModules.PermissionsAndroid.shouldShowRequestPermissionRationale(
              PERMISSIONS[permission],
            ).then((shouldShow) => (shouldShow ? 'denied' : 'restricted'));
          }

          return 'undetermined';
        });
      });
    }

    return Promise.resolve('restricted');
  };

  request = (
    permission: string,
    options?: string | { type?: string, rationale?: Rationale },
  ): Promise<PermissionStatus> => {
    if (!PERMISSIONS[permission]) {
      return Promise.reject(
        new Error(`ReactNativePermissions: ${permission} is not a valid permission type`),
      );
    }

    if (Platform.OS === 'android') {
      let rationale: Rationale;

      if (typeof options === 'object' && options.rationale) {
        rationale = options.rationale;
      }

      return PermissionsAndroid.request(PERMISSIONS[permission], rationale).then((result) => {
        // PermissionsAndroid.request() to native module resolves to boolean
        // rather than string if running on OS version prior to Android M
        if (typeof result === 'boolean') {
          return result ? 'authorized' : 'denied';
        }

        return setDidAskOnce(permission).then(() => ANDROID_RESULTS[result]); // result = 'true'
      });
    }

    return Promise.resolve('restricted');
  };

  checkMultiple = (permissions: string[]): Promise<{ [permission: string]: PermissionStatus }> =>
    Promise.all(permissions.map((permission) => this.check(permission))).then((result) =>
      result.reduce((acc, value, i) => {
        acc[permissions[i]] = value;
        return acc;
      }, {}),
    );
}

export default new ReactNativePermissions();
