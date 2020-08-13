import React from 'react';
import { StackNavigator } from 'react-navigation';
import LoginScreen from './LoginScreen';
import WebViewScreen from './subScreen/WebViewScreen';

const routeConfigMap = {
  //handleChange要以props形式传入LoginScreen
  Home: {
    screen: (params) => (
      <LoginScreen {...params} handleChange={LoginScreen_StackNavigator.handleChange} />
    ),
  },
  WebView: {
    screen: WebViewScreen,
  },
};

const stackConfig = {
  initialRouteName: 'Home',
  headerMode: 'none',
};

const LoginScreen_StackNavigator = StackNavigator(routeConfigMap, stackConfig);
export default LoginScreen_StackNavigator;
