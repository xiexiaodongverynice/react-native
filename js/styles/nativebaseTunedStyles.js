/*eslint-disable*/
import { PixelRatio } from 'react-native';
import { getTheme } from 'native-base';
import platformVariables from 'native-base/src/theme/variables/platform';
import _ from 'lodash';

//查看详情时使用的Theme
export function getDetailScreenViewingNativeBaseTheme() {
  const platformTheme = getTheme(platformVariables);
  const copied = _.clone(platformTheme);
  copied['NativeBase.ListItem']['marginLeft'] = 10;
  copied['NativeBase.ListItem']['paddingRight'] = 10;
  return copied;
}

//nativebase的样式是可以覆盖的。
//参考nativebase的默认样式位于 nativebase/src/theme/components
//
//使用示例
// import { getDetailScreenViewingNativeBaseTheme } from '../../styles/nativebaseTunedStyles';
// import { StyleProvider } from 'native-base';
// <StyleProvider style={getDetailScreenNativeBaseStyle()}>
//   <Picker placeholder={'placeholder0'} onValueChange={() => {}}>
//     <Picker.Item label={'label0'} value={'value0'} />
//     <Picker.Item label={'label1'} value={'value1'} />
//   </Picker>
// </StyleProvider>
