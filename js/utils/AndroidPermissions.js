/**
 * only for Android.
 * 1. 三星 S9+ 没有禁止选项，所有动态权限都无限制可以弹出
 * 2. vivo 被禁止后，无法继续弹框
 */
import { Platform } from 'react-native';
import _ from 'lodash';
import Permissions from '../lib/androidPermissions';

function request(permission) {
  return Permissions.request(permission.type, permission.params).then((response) => {
    // Response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
    if (response === 'denied' || response === 'undetermined') {
      return Promise.reject(new Error('您没有授权此App访问您的' + permission.name));
    } else {
      return Promise.resolve();
    }
  });
}

function Camera() {
  return request(permission.common.camera);
}

function Photo() {
  return request(permission.common.photo);
}

function Location() {
  return request(permission.common.location);
}

function Microphone() {
  return request(permission.common.microphone);
}

function androidStorage() {
  return request(permission.android.storage);
}

function readPhoneState() {
  return request(permission.android.readPhoneState);
}

// 启动请求的权限组
function requestOnStart() {
  const promiseCreators = [Location, readPhoneState, androidStorage];

  let res = Promise.resolve();
  _.each(promiseCreators, (pc) => {
    res = res.finally(() => pc());
  });
  return res;
}

const exportObj = {
  Camera,
  Photo,
  Location,
  Microphone,
  androidStorage,
  readPhoneState,
  requestOnStart,
};

if (Platform.OS === 'ios') {
  _.each(exportObj, (value, key) => {
    exportObj[key] = () => Promise.resolve();
  });
}

export default exportObj;

const permission = {
  // 通用
  common: {
    photo: {
      type: 'photo',
      name: '相册',
    },
    camera: {
      type: 'camera',
      name: '相机',
    },
    location: {
      type: 'location',
      name: '定位权限',
      // params: {type: 'whenInUse'}
    },
    microphone: {
      type: 'microphone',
      name: '麦克风',
    },
    // event: {
    //   type:'event',
    //   name:''
    // },
    contacts: {
      type: 'contacts',
      name: '联系人',
    },
  },
  // android系统
  android: {
    storage: {
      type: 'storage',
      name: '存储卡',
    },
    callPhone: {
      type: 'callPhone',
      name: '电话呼叫',
    },
    readSms: {
      type: 'readSms',
      name: '短信',
    },
    receiveSms: {
      type: 'receiveSms',
      name: '短信',
    },
    readPhoneState: {
      type: 'readPhoneState',
      name: '手机信息',
    },
  },
};
