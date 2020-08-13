// @flow
import IconIonicons from 'react-native-vector-icons/Ionicons';
import React from 'react';
import { Platform, View } from 'react-native';

const uncheckedName = 'ios-radio-button-off';
const checkedName = 'ios-checkmark-circle';

//Ionicons在ios上vertical align有bug
//在#301有人汇报此bug，有人提交了pull request 939，但仍然没有merge到master中。所以先用这种方式fix
//see https://github.com/oblador/react-native-vector-icons/issues/301
//see https://github.com/oblador/react-native-vector-icons/issues/566
//see https://github.com/oblador/react-native-vector-icons/pull/939
function IconIoniconsFixed(props) {
  if (Platform.OS === 'ios') {
    const paddingTop1 = { paddingTop: 2 };
    return (
      <View style={paddingTop1}>
        <IconIonicons {...props} />
      </View>
    );
  } else {
    return <IconIonicons {...props} />;
  }
}

//LoginScreen，用25号字，绿底
export function IconUnchecked_LoginScreen() {
  const color = '#cccccc';
  return <IconIoniconsFixed name={uncheckedName} size={25} color={color} />;
}

export function IconChecked_LoginScreen() {
  const color = '#4CA849';
  return <IconIoniconsFixed name={checkedName} size={25} color={color} />;
}

//单选、多选页面，用22号字，蓝底
export function IconUnchecked_ListView() {
  const color = '#cccccc';
  return <IconIoniconsFixed name={uncheckedName} size={20} color={color} />;
}

export function IconChecked_ListView() {
  const color = '#4C9EF6';
  return <IconIoniconsFixed name={checkedName} size={20} color={color} />;
}

export function IconCheckedDisabled_ListView() {
  //已选中、禁止重复选择时，用CheckedDisabled
  const color = '#666';
  return <IconIoniconsFixed name={checkedName} size={20} color={color} />;
}
