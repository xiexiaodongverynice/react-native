/*
 Created by Uncle Charlie, 2017/11/22
 @flow
 */
import React from 'react';
import { Provider } from 'react-redux';
import CodePush from 'react-native-code-push';
import Orientation from 'react-native-orientation';
import configureStore from './store';
import rootSaga from './sagas';
import App from './App';

const store = configureStore();
store.runSaga(rootSaga);

export default function setup() {
  class Root extends React.Component {
    componentDidMount() {
      Orientation.lockToPortrait();
    }
    render() {
      return (
        <Provider store={store}>
          <App />
        </Provider>
      );
    }
  }

  const codePushOptions = { checkFrequency: CodePush.CheckFrequency.MANUAL };
  return CodePush(codePushOptions)(Root);
}
