/**
 * Created by Uncle Charlie, 2017/12/06
 * @flow
 */

import React from 'react';
import { AppState, Platform } from 'react-native';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import _ from 'lodash';
import JPushModule from 'jpush-react-native';
import { Root } from 'native-base';
import moment from 'moment';
import loadCacheAction from './actions/cache';
import Tabs from './Tabs';
import LoginScreen_StackNavigator from './tabs/LoginScreen_StackNavigator';
import ForgotPWDScreen from './tabs/ForgotPWDScreen';
import TerritoryChangeScreen from './tabs/subScreen/TerritoryChangeScreen';
import { logoutAction } from './actions/login';
import CacheService from './services/cache';
import HotUpdate from './tabs/hotUpdate/HotUpdate';
import AcStorage from './utils/AcStorage';
import { COUNT_APP_TIME } from './utils/const';
import Globals from './utils/Globals';
import StatusBar, { BAR_STYLE } from './components/statusBar';
import SplashScreen from './react-native-splash-screen';
import { RNMWrapper } from './lib/RNMWrapper/RNMWrapper';

type Prop = {
  permission: any,
  tabs: any,
  loginStatus: number,
  dispatch: void,
  actions: {
    loadCacheAction: () => void,
    logoutAction: () => void,
  },
};

class App extends React.Component<Prop, {}> {
  appState: string = '';

  state = {
    isLoginScreen: true,
  };

  async componentWillMount() {
    await CacheService.prepare();
    const { actions } = this.props;
    if (__DEV__) {
      actions.loadCacheAction();
    }
  }

  async componentDidMount() {
    SplashScreen.hide();
    // const userTerritoryListStr = await AcStorage.get('userTerritoryListArr');

    // if (userTerritoryListStr) {
    //   //* 自动登录CURRENT_ACTIVE_TERRITORY重新赋值
    //   const userTerritoryListArr = JSON.parse(userTerritoryListStr) || [];
    //   _.map(userTerritoryListArr, (ite, i) => {
    //     if (ite.isSelectedMark) {
    //       Globals.setCurrentActiveTerritory(ite.id);
    //     }
    //   });
    // }

    AppState.addEventListener('change', this._handleAppStateChange);
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange);
  }

  _handleAppStateChange = async (nextAppState) => {
    const { actions } = this.props;

    if (global.IS_APP_ACTIVE) return;

    if (this.appState === 'background' && nextAppState === 'active') {
      let [backgroundTime, countTime] = await AcStorage.get(['toBackgroundTime', COUNT_APP_TIME]);
      if (!countTime) {
        countTime = 10;
      }

      backgroundTime = _.toNumber(backgroundTime);
      const minutesInBackground = (moment().valueOf() - backgroundTime) / 60000;

      if (minutesInBackground > countTime) {
        actions.logoutAction();
      }

      if (Platform.OS === 'ios') {
        JPushModule.setBadge(0, (success) => {
          console.log('badge===>');
        });
      }
    } else if (nextAppState === 'background') {
      const time = moment().valueOf();
      AcStorage.save({ toBackgroundTime: time });
    }

    this.appState = nextAppState;
  };

  _handleLoginScreenChange = (isLogin: boolean) => {
    this.setState({ isLoginScreen: isLogin });
  };

  renderComponent = () => {
    LoginScreen_StackNavigator.handleChange = this._handleLoginScreenChange; //handleChange要以props形式传入LoginScreen
    const { permission, tabs, loginStatus, dispatch } = this.props;
    if (loginStatus === 2 || loginStatus === 0) {
      return this.state.isLoginScreen ? (
        <LoginScreen_StackNavigator />
      ) : (
        <ForgotPWDScreen handleChange={this._handleLoginScreenChange} />
      );
    } else if (loginStatus === 3) {
      return <TerritoryChangeScreen goLogin />;
    }
    return this.renderMain();
  };

  renderMain() {
    const { permission, tabs, dispatch } = this.props;
    const Nav = Tabs(tabs, permission, {
      dispatch,
    });

    return (
      <React.Fragment>
        <StatusBar style={BAR_STYLE.light} />
        <Nav />
      </React.Fragment>
    );
  }

  render() {
    return (
      <React.Fragment>
        <StatusBar style={BAR_STYLE.dark} />
        <Root>{this.renderComponent()}</Root>
        <RNMWrapper />
        <HotUpdate />
      </React.Fragment>
    );
  }
}

const select = (state) => ({
  loginStatus: state.settings.loading,
  permission: state.settings.permission,
  tabs: state.settings.tabs,
  token: state.settings.token,
});

const act = (dispatch) => ({
  actions: bindActionCreators({ loadCacheAction, logoutAction }, dispatch),
  dispatch,
});

export default connect(select, act)(App);
