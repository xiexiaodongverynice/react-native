/*
 Created by Uncle Charlie, 2017/11/27
 @flow
 */

import React from 'react';
import { Text, View, StyleSheet, Alert, Modal, TouchableOpacity, Dimensions } from 'react-native';
import {
  Button,
  ActionSheet,
  Container,
  Content,
  List,
  ListItem,
  Icon,
  Header,
  Spinner,
  Left,
  Right,
  Body,
  Title,
} from 'native-base';
import _ from 'lodash';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { logoutAction, clearLogoutAction } from '../actions/login';
import { switchLocale, resetCacheAction } from '../actions/cache';
import { app_version, isCloseUpdate } from '../utils/config';
import I18n from '../i18n';
import Constants from './common/Constants';
import LoginScreen from './LoginScreen';
import { toastSuccess, toastWaring, toastError, toastDefault } from '../utils/toast';
import { StyledContainer, StyledHeader } from './common/components';
import themes from './common/theme';
import { updateDeviceVersion } from '../actions/updateVersion';
import ModalWrapper from '../components/modal/ModalWrapper';
import ModalLoadingScreen from '../components/modal/ModalLoadingScreen';
import { toWebView } from '../utils/licenseUtil';

const DEVICE_WIDTH = Dimensions.get('window').width;

type Prop = {
  actions: any,
  navigation: any,
  loginStatus: any,
  checkLoading: any,
  error: any,
  versionInfo: any,
  loginStatus: any,
  needUpdate: any,
};

type State = {
  userTerritoryList: any,
  isHasUpdate: Boolean,
  isUpdateError: Boolean,
};

class SettingsScreen extends React.Component<Prop, State> {
  state: State = {
    userTerritoryList: [],
    isHasUpdate: false,
    isUpdateError: false,
  };

  componentWillMount() {
    const cacheUserTerritoryListArr =
      global.USER_TERRITORY_LIST_ARR && _.isString(global.USER_TERRITORY_LIST_ARR)
        ? JSON.parse(global.USER_TERRITORY_LIST_ARR)
        : [];

    if (!_.isEmpty(cacheUserTerritoryListArr)) {
      this.setState({
        userTerritoryList: cacheUserTerritoryListArr,
      });
    }

    if (!isCloseUpdate) {
      this.props.actions.updateDeviceVersion();
    }
  }

  componentDidMount() {
    this.LANGUAGES = [
      { key: 'system', isPreset: true, label: () => I18n.t('based_system') },
      ...I18n.getLanguageList(),
      { key: '', isPreset: true, label: () => I18n.t('common_cancel') },
    ];
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.needUpdate != nextProps.needUpdate && nextProps.needUpdate) {
      this.setState({
        isHasUpdate: true,
      });
    }

    if (this.props.error != nextProps.error && nextProps.error) {
      this.setState({
        isUpdateError: true,
      });
    }
  }

  //* code push progress more than half
  moreThanHalf = false;

  _handleLogout = () => {
    this.props.actions.logoutAction();
  };

  handleAbout = () => {
    if (isCloseUpdate) {
      toastDefault(app_version);
    } else {
      this.props.actions.updateDeviceVersion();
    }
  };

  // *关于提示
  renderSettingsAbout = () => {
    const { checkLoading } = this.props;
    const { isHasUpdate, isUpdateError } = this.state;
    let aboutContentString = '';
    if (checkLoading) {
      aboutContentString = '正在检查更新';
    } else {
      if (isUpdateError) {
        aboutContentString = `当前版本${app_version}，检查更新`;
      } else {
        if (isHasUpdate) {
          aboutContentString = `当前版本${app_version}，发现新版本`;
        } else {
          aboutContentString = `当前版本${app_version}，已是最新版`;
        }
      }
    }

    if (checkLoading) {
      return (
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ color: '#999' }}>{aboutContentString}</Text>
          <Spinner
            color="#999"
            style={{
              height: '20%',
              marginTop: '3%',
              marginLeft: '1%',
            }}
            size="small"
          />
        </View>
      );
    } else {
      return (
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ color: isHasUpdate || isUpdateError ? '#0076FF' : '#666' }}>
            {aboutContentString}
          </Text>
        </View>
      );
    }
  };

  showLanguageSheet = () => {
    ActionSheet.show(
      {
        options: _.map(this.LANGUAGES, (lan) => lan.label()),
        cancelButtonIndex: this.LANGUAGES.length - 1,
        title: I18n.t('change_language'),
      },
      this.updateLanguage,
    );
  };

  updateLanguage = async (langIndex) => {
    if (langIndex === this.LANGUAGES.length - 1) return;
    const { updateAppLocale } = this.props.actions;
    const locale =
      this.LANGUAGES[langIndex].key !== 'system'
        ? this.LANGUAGES[langIndex].key
        : await I18n.getSystemLocale();
    if (I18n.getLocale() !== locale) {
      I18n.setLocale(locale); // 如果担心本地存储失败，可以加上 await 做保护。
      updateAppLocale(locale);
    }
  };

  render2license = () => {
    const navigation = this.props.navigation;
    const userLicense = (
      <ListItem icon onPress={() => toWebView('user', navigation)}>
        <Body>
          <Text>{I18n.t('settings_User_Agreement')}</Text>
        </Body>
      </ListItem>
    );

    const privacyLicense = (
      <ListItem icon onPress={() => toWebView('privacy', navigation)}>
        <Body>
          <Text>{I18n.t('settings_Privacy_Policy')}</Text>
        </Body>
      </ListItem>
    );
    return [userLicense, privacyLicense];
  };

  render() {
    const { navigation, loginStatus } = this.props;
    const { userTerritoryList } = this.state;
    if (!loginStatus) {
      return <LoginScreen />;
    }
    return (
      <StyledContainer style={{ backgroundColor: themes.fill_base }}>
        <StyledHeader>
          <Left style={{ flex: 1 }}>
            <Button transparent onPress={() => this.props.navigation.navigate('DrawerOpen')}>
              <Icon name="menu" style={styles.icon} />
            </Button>
          </Left>
          <Body style={{ flex: 1, alignItems: 'center' }}>
            <Title
              style={{
                color: themes.title_text_color,
                fontSize: themes.title_size,
              }}
            >
              {I18n.t('settings')}
            </Title>
          </Body>
          <Right style={{ flex: 1 }} />
        </StyledHeader>
        <Content>
          <List>
            <ModalWrapper>
              {({ visible, show, hide }) => (
                <ListItem
                  icon
                  onPress={() => {
                    show();
                    this._handleLogout();
                  }}
                >
                  <ModalLoadingScreen
                    visibleStatus={visible}
                    tip={I18n.t('settings_CleaningCaches')}
                    handleModalLoading={() => {
                      hide();
                    }}
                    needAutoClear={false}
                  />
                  <Body>
                    <Text>{I18n.t('logout')}</Text>
                  </Body>
                  <Right>
                    <Icon name="ios-arrow-forward" />
                  </Right>
                </ListItem>
              )}
            </ModalWrapper>
            {!_.isEmpty(userTerritoryList) ? (
              <ListItem icon onPress={() => navigation.navigate('TerritoryChange')}>
                <Body>
                  <Text>{I18n.t('territory_change')}</Text>
                </Body>
                <Right>
                  <Icon name="ios-arrow-forward" />
                </Right>
              </ListItem>
            ) : null}
            <ListItem icon onPress={() => navigation.navigate('ChangePassword')}>
              <Body>
                <Text>{I18n.t('change_password')}</Text>
              </Body>
              <Right>
                <Icon name="ios-arrow-forward" />
              </Right>
            </ListItem>
            <ListItem icon onPress={this.showLanguageSheet}>
              <Body>
                <Text>{I18n.t('change_language')}</Text>
              </Body>
            </ListItem>
            <ListItem icon onPress={this.handleAbout}>
              <Body>
                <View
                  style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}
                >
                  <Text>{I18n.t('settings_about')}</Text>
                  {!isCloseUpdate ? this.renderSettingsAbout() : null}
                </View>
              </Body>
              <Right />
            </ListItem>
            {this.render2license()}
          </List>
        </Content>
      </StyledContainer>
    );
  }
}

const select = (state) => ({
  loginStatus: state.settings.loading === 1,
  locale: state.settings.locale,
  checkLoading: state.versionInfo.loading,
  error: state.versionInfo.error,
  success: state.versionInfo.success,
  needUpdate: state.versionInfo.needUpdate,
  versionInfo: state.versionInfo.data,
});

const act = (dispatch) => ({
  actions: bindActionCreators(
    { logoutAction, resetCacheAction, updateDeviceVersion, updateAppLocale: switchLocale },
    dispatch,
  ),
});

export default connect(select, act)(SettingsScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    padding: 20,
  },
  icon: {
    color: themes.title_icon_color,
    fontSize: themes.font_header_size,
  },
  modal: {
    position: 'absolute',
    width: 250,
    height: 100,
    top: (themes.deviceHeight - 100) / 2,
    left: (themes.deviceWidth - 250) / 2,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
});
