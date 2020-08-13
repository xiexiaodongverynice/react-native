/**
 * Created by Uncle Charlie, 2018/08/25
 * @flow
 */

import { NativeModules } from 'react-native';

const { RNFileViewer } = NativeModules;

/**
 * Open file in Android
 * @param {*} path File path
 * @param {*} title File display name
 */
export default function open(path: string, title?: string) {
  return RNFileViewer.open(path, title);
}
