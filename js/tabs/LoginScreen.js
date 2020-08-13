/**
 * Created by Uncle Charlie, 2017/12/07
 * @flow
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  TouchableOpacity,
  Keyboard,
  NativeModules,
} from 'react-native';
import { connect } from 'react-redux';
import { Button, Spinner } from 'native-base/src/index';
import _ from 'lodash';
import { bindActionCreators } from 'redux';
import JPushModule from 'jpush-react-native';
import I18n from '../i18n';
import { setCacheAction } from '../actions/cache';
import config from '../utils/config';
import { toastWaring } from '../utils/toast';
import themes from './common/theme';
import UserService from '../services/userService';
import IntlUtils from '../services/intlUtils';
import AcStorage from '../utils/AcStorage';
import { TENANT_ID_COLLECT, COUNT_APP_TIME } from '../utils/const';
import helpGlobal from '../utils/helpers/helpGlobal';
import { updateDeviceVersion } from '../actions/updateVersion';
import FloatTextInput from '../components/formComponents/FloatTextInput';
import assert from '../utils/assert0';
import VerticalSpacer from '../components/common/VerticalSpacer';
import { suitableHeightFromIPXHeight } from '../utils/util';
import LoginBg from './LoginBg';
import StatusBar, { BAR_STYLE } from '../components/statusBar';
import {
  IconChecked_LoginScreen as IconChecked,
  IconUnchecked_LoginScreen as IconUnchecked,
} from '../components/common/IconCheckedUnchecked';
import { getLicenseAgreed, setLicenseAgreed } from './../utils/licenseUtil';
import LicenseLayer, { ViewLicenseRow } from './new-home/LicenseLayer';
import AndroidPermissions from '../utils/AndroidPermissions';

type Prop = {
  navigation: any,
  handleChange: (islogin: boolean) => void,
  dispatch: (any) => void,
  actions: {
    updateDeviceVersion: any,
  },
};

const DEVICE_WIDTH = Dimensions.get('window').width;

class LoginScreen extends React.Component<Prop, {}> {
  state = {
    username: '',
    password: '',
    rememberLoginInfo: true,
    loading: false, //正在发送请求，这时会转菊花，禁用按钮
    errMsg: '', //错误消息，红字，显示在密码框下面
    licenseAgreed: true, //是否已同意过license了？默认已同意
  };

  deviceId = '';

  constructor(props) {
    super(props);
    this.getLicenseAgreed_then_setState();
  }

  async getLicenseAgreed_then_setState() {
    const licenseAgreed = await getLicenseAgreed();
    this.setState({ licenseAgreed });
  }

  renderErrMsg() {
    const errMsg = this.state.errMsg;
    assert(_.isString(errMsg));
    if (errMsg.length > 0) {
      return (
        <View style={styles.errMsgWrapper}>
          <Text style={styles.errMsgText}>{errMsg}</Text>
        </View>
      );
    } else {
      return <View style={styles.errMsgWrapper} />;
    }
  }

  //返回大个LoginBtn
  renderBigLoginBtn() {
    const hasEntered = _.size(this.state.username) && _.size(this.state.password);
    // const enabled = !this.state.loading && hasEntered;
    const enabled = !this.state.loading; //虽然是灰色，但是仍然可以点，这样才可以看到I18n.t('username_is_require')
    const backgroundColor = hasEntered ? themes.fill_base_login : '#cccccd';
    const style = {
      height: 44,
      backgroundColor,
    };
    const spinner = this.state.loading ? (
      <Spinner color="#fff" style={{ position: 'absolute', left: DEVICE_WIDTH * 0.25 }} />
    ) : null;

    return (
      <Button style={style} block disabled={!enabled} onPress={this.login}>
        {spinner}
        <Text style={{ color: '#fff', fontSize: 14 }}>{I18n.t('login')}</Text>
      </Button>
    );
  }

  //生成两个按钮 记住密码、忘记密码
  renderTwoBtnRow() {
    const rowHeight = 42;
    const rowStyle = { height: rowHeight, flexDirection: 'row', justifyContent: 'space-between' };
    const btnStyle = [
      {
        flexDirection: 'row',
        alignItems: 'center',
      },
      styles.border1,
    ];
    const textStyle = { color: '#666666', fontSize: 14 };
    return (
      <View style={rowStyle}>
        <TouchableOpacity //记住密码
          onPress={this.handeleRemember}
          style={btnStyle}
        >
          {this.state.rememberLoginInfo ? <IconChecked /> : <IconUnchecked />}
          <Text style={[{ marginLeft: 6 }, textStyle]}>{I18n.t('remember_password')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            this.props.handleChange(false);
          }}
          style={btnStyle}
        >
          <Text style={textStyle}>{I18n.t('login_find_password')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  render() {
    const top__filename = 'LoginScreen';
    console.logRenderHash(top__filename, this);

    return (
      <>
        <LoginBg>
          <StatusBar style={BAR_STYLE.dark} />
          <View comment="账号密码输入框">
            <FloatTextInput
              style={styles.input}
              styleSuitName="LoginScreen"
              value={this.state.username}
              keyboardType="email-address"
              label={I18n.t('login_username')}
              onChangeText={(text) => this.setState({ username: text, errMsg: '' })}
            />
            <VerticalSpacer height={suitableHeightFromIPXHeight(26)} />
            <FloatTextInput
              style={styles.input}
              styleSuitName="LoginScreen"
              value={this.state.password}
              keyboardType="default"
              label={I18n.t('login_password')}
              secureTextEntry
              multiline={false}
              onChangeText={(text) => this.setState({ password: text, errMsg: '' })}
            />
          </View>
          {this.renderErrMsg()}
          {this.renderBigLoginBtn()}
          {this.renderTwoBtnRow()}
          <VerticalSpacer height={10} />
          <View style={[styles.center, styles.width100p]}>
            <ViewLicenseRow navigation={this.props.navigation} />
          </View>
        </LoginBg>
        {this.renderLicenseLayer()}
      </>
    );
  }

  renderLicenseLayer = () => {
    const licenseAgreed = this.state.licenseAgreed;
    if (licenseAgreed) {
      return null;
    } else {
      const onAgree = () => {
        AndroidPermissions.requestOnStart();
        setLicenseAgreed(true);
        const licenseAgreed = true;
        this.setState({ licenseAgreed });
      };
      return <LicenseLayer navigation={this.props.navigation} onAgree={onAgree} />;
    }
  };

  async componentWillMount() {
    const { actions } = this.props;
    actions.updateDeviceVersion();
    this.props.handleChange(true);
    IntlUtils.init();
    let { username = '', password = '' } = await this.getStorageLoginInfo(); //可能读出null

    if (!_.isString(username)) {
      username = '';
    }
    if (!_.isString(password)) {
      password = '';
    }
    this.setState({ username, password });
  }

  async componentDidMount() {
    JPushModule.initPush();
    if (Platform.OS === 'ios') {
      const { DeviceInfoModule } = NativeModules;
      DeviceInfoModule.getDeviceId((error, event) => {
        if (error) {
          console.log(error);
          this.deviceId = '';
        } else {
          this.deviceId = event;
        }
      });
    } else if (Platform.OS === 'android') {
      JPushModule.getInfo((map) => {
        this.deviceId = _.get(map, 'myDeviceId').replace(/DeviceId: /, '');
      });
    }
  }

  //异步执行登录，
  login = async () => {
    Keyboard.dismiss(); // 强制收起键盘

    const { username, password, rememberLoginInfo } = this.state;
    const loginName = username;

    if (!_.size(username)) {
      toastWaring(I18n.t('username_is_require'), 2000, 30);
      return;
    }

    if (!_.size(password)) {
      toastWaring(I18n.t('password_is_require'), 2000, 30);
      return;
    }

    //转菊花、禁用按钮
    this.setState({ loading: true });

    const loginSSOType = _.split(config.ssoURL, '//')[1];
    let suffix = _.get(config.DOMAIN_LOGINNAME_DIC, loginSSOType);

    if (loginName.indexOf('@') < 0 && /^1\d{10}$/.test(loginName)) {
      //* 此功能只用于SAAS，其他分支合并需要注释
      //* CRM-4968 允许信宜租户通过手机号登陆app
      //* 信谊stg后缀 ===> '@sinepharm.stg'
      //* 信谊prod后缀 ===> '@sinepharm.com'
      suffix = _.get(config.DOMAIN_LOGINNAME_DIC, `${_.split(loginSSOType, '-')[0]}.sinepharm`);
    }

    const payload = {
      loginName,
      pwd: password,
      deviceType: Platform.OS === 'ios' ? 'iOS' : 'Android',
      deviceId: this.deviceId,
      appVersion: config.app_version,
      mobileDeviceCode: this.deviceId,
    };

    if (loginName.indexOf('@') < 0 && !_.isEmpty(suffix) && !_.endsWith(loginName, suffix)) {
      _.set(payload, 'loginName', `${loginName}${suffix}`);
    }
    const { err, result } = await UserService.requestLogin_insightFailreason(payload, false);
    if (err) {
      assert(_.isString(err.message), 'err应是一个Error对象');
      this.setState({ loading: false, errMsg: err.message });
      return;
    }

    JPushModule.setAlias(result.userId, (success) => {
      console.log('设置成功');
    });
    this.saveLoginInfoToAcStorage(rememberLoginInfo);

    // *如果是数组则证明是 多岗
    const userTerritoryList = _.get(result, 'userTerritoryList', []);
    if (!_.isEmpty(userTerritoryList)) {
      this.props.dispatch(setCacheAction(result));
      return;
    }
    await helpGlobal.setGlobalHelper(result);

    this.props.dispatch(setCacheAction(result));

    //* 储存TEAMID
    this.saveTeamId(result);
  };

  saveTeamId = (result) => {
    const teamId = _.get(result, 'profile.tenant_id');
    if (!teamId) return;
    if (TENANT_ID_COLLECT.LUOZHEN_TENEMENT.includes(teamId)) {
      AcStorage.save({ [COUNT_APP_TIME]: 60 * 2 });
    } else if (TENANT_ID_COLLECT.JMKX_TENEMENT.includes(teamId)) {
      AcStorage.save({ [COUNT_APP_TIME]: 60 * 6 });
    } else {
      AcStorage.save({ [COUNT_APP_TIME]: 10 });
    }
  };

  //* false 仅记住用户名 true 记住用户名和密码
  saveLoginInfoToAcStorage = async (status) => {
    const { username, password } = this.state;
    if (!status) {
      AcStorage.save({ rememberUser: username });
      AcStorage.remove('rememberPassword');
    } else {
      AcStorage.save({ rememberUser: username, rememberPassword: password });
    }
  };

  getStorageLoginInfo = async () => {
    const [_username = '', _password = ''] = await AcStorage.get([
      'rememberUser',
      'rememberPassword',
    ]);
    return { username: JSON.parse(_username), password: JSON.parse(_password) };
  };

  handeleRemember = () => {
    const { rememberLoginInfo } = this.state;
    this.setState({ rememberLoginInfo: !rememberLoginInfo });
  };
}

const act = (dispatch) => ({
  actions: bindActionCreators({ updateDeviceVersion }, dispatch),
  dispatch,
});

const select = (state) => ({});

export default connect(select, act)(LoginScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'stretch', //将item水平拉伸
    paddingTop: 20,
    paddingLeft: 30,
    paddingRight: 30,
    backgroundColor: 'white',
  },
  border1: {
    // borderWidth: 1,
    // borderColor: 'black',
    // borderStyle: 'solid',
  },
  width100p: {
    width: '100%',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    lineHeight: 20,
  },
  checkBox: {
    width: 1,
    height: 1,
  },
  copyright: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 45,
    fontSize: 12,
    textAlign: 'center',
    color: '#666666',
  },
  errMsgWrapper: {
    marginTop: 12,
    marginBottom: 12,
  },
  errMsgText: {
    fontSize: 14,
    color: '#EC2424',
    lineHeight: 20,
  },
});
