/**
 *Created by Guanghua on 01/02;
 */

import Toast from 'react-native-root-toast';
import themes from '../tabs/common/theme';

export function toastSuccess(content, duration, position) {
  return Toast.show(content.toString(), {
    delay: 0,
    duration: duration || Toast.durations.SHORT,
    position: position || Toast.positions.CENTER,
    shadow: true,
    animation: true,
    hideOnPress: true,
    backgroundColor: themes.color_text_base,
  });
}

export function toastError(content, duration, position) {
  return Toast.show(content.toString(), {
    delay: 0,
    duration: duration || Toast.durations.SHORT,
    shadow: true,
    animation: true,
    hideOnPress: true,
    backgroundColor: 'red',
  });
}

export function toastLayoutErrorCode(code, duration, position) {
  return Toast.show(`布局配置不正确,error code :${code}`, {
    delay: 0,
    duration: duration || Toast.durations.SHORT,
    shadow: true,
    animation: true,
    hideOnPress: true,
    backgroundColor: '#F8C014',
  });
}

export function toastWaring(content, duration, position) {
  return Toast.show(content.toString(), {
    duration: duration || Toast.durations.SHORT,
    // position: position || Toast.positions.CENTER,
    shadow: true,
    animation: true,
    hideOnPress: true,
    delay: 0,
    backgroundColor: '#F8C014',
  });
}

export function toastDefault(content, duration, position) {
  return Toast.show(content.toString(), {
    duration: duration || Toast.durations.SHORT,
    // position: position || Toast.positions.CENTER,
    shadow: true,
    animation: true,
    hideOnPress: true,
    delay: 0,
  });
}

//位置为center
export function toastDefaultCenter(content, duration) {
  return Toast.show(content.toString(), {
    duration: duration || Toast.durations.SHORT,
    position: Toast.positions.CENTER,
    shadow: true,
    animation: true,
    hideOnPress: true,
    delay: 0,
  });
}
