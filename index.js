import { AppRegistry } from 'react-native';
import './js/utils/global';
import setup from './js/setup';

console.disableYellowBox = true;
if (!__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

AppRegistry.registerComponent('MobileCRM', () => setup());
